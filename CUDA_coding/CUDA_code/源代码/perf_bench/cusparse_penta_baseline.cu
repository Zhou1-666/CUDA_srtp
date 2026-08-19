#include <cuda_runtime.h>
#include <cusparse.h>

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <limits>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

constexpr double kPi = 3.141592653589793238462643383279502884;
constexpr double kTolerance = 1.0e-10;

void check_cuda(cudaError_t status, const char* expression, const char* file, int line) {
    if (status != cudaSuccess) {
        throw std::runtime_error(std::string("CUDA failure at ") + file + ":" +
                                 std::to_string(line) + " for " + expression + ": " +
                                 cudaGetErrorString(status));
    }
}

void check_cusparse(cusparseStatus_t status, const char* expression, const char* file, int line) {
    if (status != CUSPARSE_STATUS_SUCCESS) {
        throw std::runtime_error(std::string("cuSPARSE failure at ") + file + ":" +
                                 std::to_string(line) + " for " + expression + ": " +
                                 cusparseGetErrorString(status));
    }
}

#define CHECK_CUDA(expression) check_cuda((expression), #expression, __FILE__, __LINE__)
#define CHECK_CUSPARSE(expression) check_cusparse((expression), #expression, __FILE__, __LINE__)

template <typename T>
T* device_allocate(std::size_t count) {
    T* pointer = nullptr;
    CHECK_CUDA(cudaMalloc(reinterpret_cast<void**>(&pointer), count * sizeof(T)));
    return pointer;
}

int parse_positive(const char* text, const char* name) {
    char* end = nullptr;
    const long value = std::strtol(text, &end, 10);
    if (end == text || *end != '\0' || value <= 0 || value > std::numeric_limits<int>::max()) {
        throw std::runtime_error(std::string(name) + " must be a positive 32-bit integer");
    }
    return static_cast<int>(value);
}

int parse_nonnegative(const char* text, const char* name) {
    char* end = nullptr;
    const long value = std::strtol(text, &end, 10);
    if (end == text || *end != '\0' || value < 0 || value > std::numeric_limits<int>::max()) {
        throw std::runtime_error(std::string(name) + " must be a nonnegative 32-bit integer");
    }
    return static_cast<int>(value);
}

__device__ double device_exact_value(int row, int nrow, int case_id) {
    if (case_id == 0) {
        return 1.0;
    }
    const double angle = 2.0 * kPi * static_cast<double>(row) / static_cast<double>(nrow);
    return 1.0 + 0.1 * sin(angle) + 0.05 * cos(2.0 * angle);
}

__global__ void initialize_interleaved(double* ds,
                                       double* dl,
                                       double* d,
                                       double* du,
                                       double* dw,
                                       double* rhs,
                                       int batch_count,
                                       int nrow,
                                       int case_id,
                                       std::size_t total) {
    const std::size_t index = static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
    if (index >= total) {
        return;
    }

    const int row = static_cast<int>(index / static_cast<std::size_t>(batch_count));
    ds[index] = row >= 2 ? 1.0 : 0.0;
    dl[index] = row >= 1 ? 1.0 : 0.0;
    d[index] = -4.0;
    du[index] = row + 1 < nrow ? 1.0 : 0.0;
    dw[index] = row + 2 < nrow ? 1.0 : 0.0;

    double value = -4.0 * device_exact_value(row, nrow, case_id);
    if (row >= 2) {
        value += device_exact_value(row - 2, nrow, case_id);
    }
    if (row >= 1) {
        value += device_exact_value(row - 1, nrow, case_id);
    }
    if (row + 1 < nrow) {
        value += device_exact_value(row + 1, nrow, case_id);
    }
    if (row + 2 < nrow) {
        value += device_exact_value(row + 2, nrow, case_id);
    }
    rhs[index] = value;
}

double host_exact_value(int row, int nrow, int case_id) {
    if (case_id == 0) {
        return 1.0;
    }
    const double angle = 2.0 * kPi * static_cast<double>(row) / static_cast<double>(nrow);
    return 1.0 + 0.1 * std::sin(angle) + 0.05 * std::cos(2.0 * angle);
}

double host_rhs_value(int row, int nrow, int case_id) {
    double value = -4.0 * host_exact_value(row, nrow, case_id);
    if (row >= 2) {
        value += host_exact_value(row - 2, nrow, case_id);
    }
    if (row >= 1) {
        value += host_exact_value(row - 1, nrow, case_id);
    }
    if (row + 1 < nrow) {
        value += host_exact_value(row + 1, nrow, case_id);
    }
    if (row + 2 < nrow) {
        value += host_exact_value(row + 2, nrow, case_id);
    }
    return value;
}

std::string gpu_uuid(const cudaDeviceProp& property) {
    std::ostringstream stream;
    stream << "GPU-" << std::hex << std::setfill('0');
    for (unsigned char byte : property.uuid.bytes) {
        stream << std::setw(2) << static_cast<unsigned int>(byte);
    }
    return stream.str();
}

void copy_problem(double* const source[6], double* const destination[6], std::size_t bytes) {
    for (int field = 0; field < 6; ++field) {
        CHECK_CUDA(cudaMemcpyAsync(destination[field], source[field], bytes, cudaMemcpyDeviceToDevice));
    }
}

}  // namespace

int main(int argc, char** argv) {
    if (argc != 7) {
        std::cerr << "usage: " << argv[0]
                  << " n1 n2 n3 iterations warmups exact1|manufactured\n";
        return EXIT_FAILURE;
    }

    cusparseHandle_t handle = nullptr;
    cudaEvent_t end_to_end_start = nullptr;
    cudaEvent_t solver_start = nullptr;
    cudaEvent_t solver_stop = nullptr;
    cudaEvent_t end_to_end_stop = nullptr;
    double* pristine[6] = {};
    double* working[6] = {};
    void* workspace = nullptr;

    try {
        const int n1 = parse_positive(argv[1], "n1");
        const int n2 = parse_positive(argv[2], "n2");
        const int nrow = parse_positive(argv[3], "n3");
        const int iterations = parse_positive(argv[4], "iterations");
        const int warmups = parse_nonnegative(argv[5], "warmups");
        const std::string case_name = argv[6];
        const int case_id = case_name == "exact1" ? 0 : case_name == "manufactured" ? 1 : -1;
        if (case_id < 0) {
            throw std::runtime_error("case must be exact1 or manufactured");
        }
        if (nrow < 5) {
            throw std::runtime_error("n3 must be at least 5 for this five-diagonal baseline");
        }

        const long long batch_long = static_cast<long long>(n1) * static_cast<long long>(n2);
        if (batch_long > std::numeric_limits<int>::max()) {
            throw std::runtime_error("n1*n2 exceeds the cuSPARSE 32-bit batchCount limit");
        }
        const int batch_count = static_cast<int>(batch_long);
        const std::size_t total = static_cast<std::size_t>(batch_count) * static_cast<std::size_t>(nrow);
        if (total > std::numeric_limits<std::size_t>::max() / sizeof(double)) {
            throw std::runtime_error("problem byte count overflows size_t");
        }
        const std::size_t bytes = total * sizeof(double);

        int device = 0;
        CHECK_CUDA(cudaGetDevice(&device));
        cudaDeviceProp property{};
        CHECK_CUDA(cudaGetDeviceProperties(&property, device));

        for (int field = 0; field < 6; ++field) {
            pristine[field] = device_allocate<double>(total);
            working[field] = device_allocate<double>(total);
        }

        constexpr int threads = 256;
        const unsigned int blocks = static_cast<unsigned int>((total + threads - 1) / threads);
        initialize_interleaved<<<blocks, threads>>>(pristine[0], pristine[1], pristine[2],
                                                    pristine[3], pristine[4], pristine[5],
                                                    batch_count, nrow, case_id, total);
        CHECK_CUDA(cudaGetLastError());
        CHECK_CUDA(cudaDeviceSynchronize());
        copy_problem(pristine, working, bytes);
        CHECK_CUDA(cudaDeviceSynchronize());

        CHECK_CUSPARSE(cusparseCreate(&handle));
        int cusparse_version = 0;
        CHECK_CUSPARSE(cusparseGetVersion(handle, &cusparse_version));
        int cuda_runtime_version = 0;
        int cuda_driver_version = 0;
        CHECK_CUDA(cudaRuntimeGetVersion(&cuda_runtime_version));
        CHECK_CUDA(cudaDriverGetVersion(&cuda_driver_version));

        std::size_t workspace_bytes = 0;
        constexpr int algorithm = 0;
        CHECK_CUSPARSE(cusparseDgpsvInterleavedBatch_bufferSizeExt(
            handle, algorithm, nrow, working[0], working[1], working[2],
            working[3], working[4], working[5], batch_count, &workspace_bytes));
        CHECK_CUDA(cudaMalloc(&workspace, std::max<std::size_t>(workspace_bytes, 128)));

        CHECK_CUDA(cudaEventCreate(&end_to_end_start));
        CHECK_CUDA(cudaEventCreate(&solver_start));
        CHECK_CUDA(cudaEventCreate(&solver_stop));
        CHECK_CUDA(cudaEventCreate(&end_to_end_stop));

        for (int warmup = 0; warmup < warmups; ++warmup) {
            copy_problem(pristine, working, bytes);
            CHECK_CUSPARSE(cusparseDgpsvInterleavedBatch(
                handle, algorithm, nrow, working[0], working[1], working[2],
                working[3], working[4], working[5], batch_count, workspace));
            CHECK_CUDA(cudaDeviceSynchronize());
        }

        double solver_ms_sum = 0.0;
        double end_to_end_ms_sum = 0.0;
        for (int iteration = 0; iteration < iterations; ++iteration) {
            CHECK_CUDA(cudaEventRecord(end_to_end_start));
            copy_problem(pristine, working, bytes);
            CHECK_CUDA(cudaEventRecord(solver_start));
            CHECK_CUSPARSE(cusparseDgpsvInterleavedBatch(
                handle, algorithm, nrow, working[0], working[1], working[2],
                working[3], working[4], working[5], batch_count, workspace));
            CHECK_CUDA(cudaEventRecord(solver_stop));
            CHECK_CUDA(cudaEventRecord(end_to_end_stop));
            CHECK_CUDA(cudaEventSynchronize(end_to_end_stop));

            float solver_ms = 0.0F;
            float end_to_end_ms = 0.0F;
            CHECK_CUDA(cudaEventElapsedTime(&solver_ms, solver_start, solver_stop));
            CHECK_CUDA(cudaEventElapsedTime(&end_to_end_ms, end_to_end_start, end_to_end_stop));
            solver_ms_sum += static_cast<double>(solver_ms);
            end_to_end_ms_sum += static_cast<double>(end_to_end_ms);
        }

        std::vector<double> solution(total);
        CHECK_CUDA(cudaMemcpy(solution.data(), working[5], bytes, cudaMemcpyDeviceToHost));

        long double error_square_sum = 0.0L;
        double error_linf = 0.0;
        double residual_linf = 0.0;
        for (int row = 0; row < nrow; ++row) {
            const double expected = host_exact_value(row, nrow, case_id);
            const double expected_rhs = host_rhs_value(row, nrow, case_id);
            for (int system = 0; system < batch_count; ++system) {
                const std::size_t index = static_cast<std::size_t>(row) * batch_count + system;
                const double error = solution[index] - expected;
                error_square_sum += static_cast<long double>(error) * error;
                error_linf = std::max(error_linf, std::abs(error));

                double applied = -4.0 * solution[index];
                if (row >= 2) {
                    applied += solution[static_cast<std::size_t>(row - 2) * batch_count + system];
                }
                if (row >= 1) {
                    applied += solution[static_cast<std::size_t>(row - 1) * batch_count + system];
                }
                if (row + 1 < nrow) {
                    applied += solution[static_cast<std::size_t>(row + 1) * batch_count + system];
                }
                if (row + 2 < nrow) {
                    applied += solution[static_cast<std::size_t>(row + 2) * batch_count + system];
                }
                residual_linf = std::max(residual_linf, std::abs(applied - expected_rhs));
            }
        }
        const double error_rms = std::sqrt(static_cast<double>(error_square_sum / total));
        const double solver_ms_avg = solver_ms_sum / iterations;
        const double end_to_end_ms_avg = end_to_end_ms_sum / iterations;
        const double input_restore_ms_avg = end_to_end_ms_avg - solver_ms_avg;

        std::cout << "TASK-022 cuSPARSE P=1 pentadiagonal baseline\n"
                  << "case=" << case_name << " n1=" << n1 << " n2=" << n2
                  << " n3=" << nrow << " batchCount=" << batch_count << '\n'
                  << "layout=interleaved-native layout_conversion_ms=0"
                  << " solver_ms_avg=" << std::setprecision(10) << solver_ms_avg
                  << " end_to_end_ms_avg=" << end_to_end_ms_avg << '\n'
                  << "error_rms=" << std::scientific << error_rms
                  << " error_linf=" << error_linf
                  << " residual_linf=" << residual_linf << '\n';

        std::cout << "implementation,case,n1,n2,n3,batch_count,system_size,iterations,warmups,"
                     "solver_ms_avg,end_to_end_ms_avg,input_restore_ms_avg,layout_conversion_ms,"
                     "error_rms,error_linf,residual_linf,buffer_bytes,cusparse_version,"
                     "cuda_runtime_version,cuda_driver_version,gpu_name,gpu_uuid\n";
        std::cout << std::defaultfloat << std::setprecision(12)
                  << "cusparse_penta," << case_name << ',' << n1 << ',' << n2 << ',' << nrow
                  << ',' << batch_count << ',' << nrow << ',' << iterations << ',' << warmups
                  << ',' << solver_ms_avg << ',' << end_to_end_ms_avg << ',' << input_restore_ms_avg
                  << ",0," << error_rms << ',' << error_linf << ',' << residual_linf
                  << ',' << workspace_bytes << ',' << cusparse_version << ',' << cuda_runtime_version
                  << ',' << cuda_driver_version << ',' << property.name << ',' << gpu_uuid(property)
                  << '\n';

        if (!std::isfinite(error_rms) || !std::isfinite(error_linf) ||
            !std::isfinite(residual_linf) || error_rms > kTolerance ||
            error_linf > kTolerance || residual_linf > kTolerance) {
            std::cerr << "TASK-022 correctness gate failed: tolerance=" << kTolerance << '\n';
            return EXIT_FAILURE;
        }

        CHECK_CUDA(cudaEventDestroy(end_to_end_start));
        end_to_end_start = nullptr;
        CHECK_CUDA(cudaEventDestroy(solver_start));
        solver_start = nullptr;
        CHECK_CUDA(cudaEventDestroy(solver_stop));
        solver_stop = nullptr;
        CHECK_CUDA(cudaEventDestroy(end_to_end_stop));
        end_to_end_stop = nullptr;
        CHECK_CUDA(cudaFree(workspace));
        workspace = nullptr;
        CHECK_CUSPARSE(cusparseDestroy(handle));
        handle = nullptr;
        for (int field = 0; field < 6; ++field) {
            CHECK_CUDA(cudaFree(pristine[field]));
            pristine[field] = nullptr;
            CHECK_CUDA(cudaFree(working[field]));
            working[field] = nullptr;
        }
        return EXIT_SUCCESS;
    } catch (const std::exception& error) {
        std::cerr << "TASK-022 failed: " << error.what() << '\n';
        if (end_to_end_start != nullptr) cudaEventDestroy(end_to_end_start);
        if (solver_start != nullptr) cudaEventDestroy(solver_start);
        if (solver_stop != nullptr) cudaEventDestroy(solver_stop);
        if (end_to_end_stop != nullptr) cudaEventDestroy(end_to_end_stop);
        if (workspace != nullptr) cudaFree(workspace);
        if (handle != nullptr) cusparseDestroy(handle);
        for (int field = 0; field < 6; ++field) {
            if (pristine[field] != nullptr) cudaFree(pristine[field]);
            if (working[field] != nullptr) cudaFree(working[field]);
        }
        return EXIT_FAILURE;
    }
}
