using Mau.Desktop.Core;
using Xunit;

namespace Mau.Desktop.Tests;

public class ResultTests
{
    [Fact]
    public void Success_ShouldContainData()
    {
        var result = Result<string>.Success("ok");
        Assert.True(result.IsSuccess);
        Assert.Equal("ok", result.Data);
    }
}
