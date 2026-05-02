using Mau.Desktop.Models.Warehouse;

namespace Mau.Desktop.Api;

public sealed class WarehouseApi
{
    private readonly IApiClient _apiClient;

    public WarehouseApi(IApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    public Task<ApiResponse<WeightSubmissionResponse>> SubmitWeightAsync(WeightSubmissionRequest request, CancellationToken cancellationToken = default)
    {
        return _apiClient.PostAsync<WeightSubmissionRequest, WeightSubmissionResponse>("/warehouse/weighing", request, cancellationToken);
    }
}
