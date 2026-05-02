using Mau.Desktop.Api;
using Mau.Desktop.Models.Warehouse;

namespace Mau.Desktop.Services;

public sealed class WarehouseService
{
    private readonly WarehouseApi _warehouseApi;

    public WarehouseService(WarehouseApi warehouseApi)
    {
        _warehouseApi = warehouseApi;
    }

    public Task<ApiResponse<WeightSubmissionResponse>> SubmitWeightAsync(WeightSubmissionRequest request, CancellationToken cancellationToken = default)
    {
        return _warehouseApi.SubmitWeightAsync(request, cancellationToken);
    }
}
