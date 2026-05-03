namespace Mau.Desktop.Core;

public sealed class Result<T>
{
    private Result(bool isSuccess, T? data, string? errorMessage)
    {
        IsSuccess = isSuccess;
        Data = data;
        ErrorMessage = errorMessage;
    }

    public bool IsSuccess { get; }
    public T? Data { get; }
    public string? ErrorMessage { get; }

    public static Result<T> Success(T data) => new(true, data, null);

    public static Result<T> Failure(string message) => new(false, default, message);
}
