using Mau.Desktop.Commands;
using Mau.Desktop.Services;
using System.Net.Mail;
using System.Windows.Input;

namespace Mau.Desktop.ViewModels;

public sealed class LoginWindowViewModel : ViewModelBase
{
    private readonly IAuthService _authService;
    private string _email = string.Empty;
    private string _latestPasswordInput = string.Empty;
    private string _errorMessage = string.Empty;
    private string _emailErrorMessage = string.Empty;
    private string _passwordErrorMessage = string.Empty;
    private string _progressAlertMessage = string.Empty;
    private double _progressValue;
    private bool _isBusy;
    private bool _isProgressError;
    private bool _isProgressIndeterminate;

    public LoginWindowViewModel(IAuthService authService)
    {
        _authService = authService;
        LoginCommand = new AsyncRelayCommand(LoginAsync, CanLogin);
    }

    public event EventHandler<bool>? LoginCompleted;

    public ICommand LoginCommand { get; }

    public string AppTitle => "MAU APP Desktop";

    public string Email
    {
        get => _email;
        set
        {
            if (SetProperty(ref _email, value))
            {
                ClearInputErrors();
                RaiseLoginCanExecuteChanged();
            }
        }
    }

    public string ErrorMessage
    {
        get => _errorMessage;
        private set
        {
            if (SetProperty(ref _errorMessage, value))
            {
                OnPropertyChanged(nameof(HasErrorMessage));
            }
        }
    }

    public bool HasErrorMessage => !string.IsNullOrWhiteSpace(ErrorMessage);

    public string EmailErrorMessage
    {
        get => _emailErrorMessage;
        private set
        {
            if (SetProperty(ref _emailErrorMessage, value))
            {
                OnPropertyChanged(nameof(HasEmailErrorMessage));
            }
        }
    }

    public bool HasEmailErrorMessage => !string.IsNullOrWhiteSpace(EmailErrorMessage);

    public string PasswordErrorMessage
    {
        get => _passwordErrorMessage;
        private set
        {
            if (SetProperty(ref _passwordErrorMessage, value))
            {
                OnPropertyChanged(nameof(HasPasswordErrorMessage));
            }
        }
    }

    public bool HasPasswordErrorMessage => !string.IsNullOrWhiteSpace(PasswordErrorMessage);

    public string ProgressAlertMessage
    {
        get => _progressAlertMessage;
        private set
        {
            if (SetProperty(ref _progressAlertMessage, value))
            {
                OnPropertyChanged(nameof(HasProgressAlertMessage));
            }
        }
    }

    public bool HasProgressAlertMessage => !string.IsNullOrWhiteSpace(ProgressAlertMessage);

    public bool IsProgressError
    {
        get => _isProgressError;
        private set => SetProperty(ref _isProgressError, value);
    }

    public bool IsProgressIndeterminate
    {
        get => _isProgressIndeterminate;
        private set => SetProperty(ref _isProgressIndeterminate, value);
    }

    public double ProgressValue
    {
        get => _progressValue;
        private set => SetProperty(ref _progressValue, value);
    }

    public string LoginButtonText => IsBusy ? "Signing In..." : "Sign In";

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (SetProperty(ref _isBusy, value))
            {
                OnPropertyChanged(nameof(LoginButtonText));
                RaiseLoginCanExecuteChanged();
            }
        }
    }

    public void OnPasswordChanged(string password)
    {
        /*
         * DEBUG FIX (LOGIN PASSWORD FLOW):
         * PasswordBox.Password pada WPF tidak selalu reliable saat dipakai langsung
         * sebagai CommandParameter. Agar request login tetap terkirim, setiap perubahan
         * password disimpan dulu di cache lokal ViewModel ini.
         *
         * Saat debug:
         * - Pastikan method ini terpanggil setiap user mengetik.
         * - Cek nilai _latestPasswordInput terisi sesuai input terakhir user.
         */
        _latestPasswordInput = password ?? string.Empty;

        PasswordErrorMessage = string.Empty;
        ErrorMessage = string.Empty;
        RaiseLoginCanExecuteChanged();
    }

    private bool CanLogin(object? parameter)
    {
        return !IsBusy;
    }

    private async Task LoginAsync(object? parameter)
    {
        /*
         * DEBUG FIX (LOGIN REQUEST TRIGGER):
         * Sumber password prioritas:
         * 1) CommandParameter dari binding PasswordBox.Password.
         * 2) Cache _latestPasswordInput dari event PasswordChanged.
         *
         * Tujuan: mencegah kasus UI menampilkan error lokal dan request tidak pernah
         * dikirim ke backend karena CommandParameter kosong/null walau user sudah input.
         */
        var passwordFromParameter = parameter as string;
        var password = !string.IsNullOrWhiteSpace(passwordFromParameter)
            ? passwordFromParameter
            : _latestPasswordInput;

        if (!ValidateInputs(password))
        {
            return;
        }

        IsBusy = true;
        IsProgressError = false;
        IsProgressIndeterminate = true;
        ProgressValue = 20;
        ProgressAlertMessage = "Sedang memproses login...";
        ErrorMessage = string.Empty;

        var result = await _authService.LoginAsync(Email.Trim(), password);

        IsBusy = false;
        IsProgressIndeterminate = false;

        if (!result.IsSuccess)
        {
            ErrorMessage = result.ErrorMessage ?? "Email atau password salah, atau backend tidak dapat diakses.";
            IsProgressError = true;
            ProgressValue = 100;
            ProgressAlertMessage = result.ErrorMessage ?? "Login gagal.";
            return;
        }

        ProgressValue = 100;
        ProgressAlertMessage = "Login berhasil.";
        LoginCompleted?.Invoke(this, true);
    }

    private bool ValidateInputs(string password)
    {
        ClearInputErrors();
        var isValid = true;
        var trimmedEmail = Email.Trim();

        if (string.IsNullOrWhiteSpace(trimmedEmail))
        {
            EmailErrorMessage = "Email wajib diisi.";
            isValid = false;
        }
        else if (!IsValidEmail(trimmedEmail))
        {
            EmailErrorMessage = "Format email tidak valid.";
            isValid = false;
        }

        if (string.IsNullOrWhiteSpace(password))
        {
            PasswordErrorMessage = "Password wajib diisi.";
            isValid = false;
        }
        else if (password.Length is < 8 or > 20)
        {
            PasswordErrorMessage = "Password harus 8-20 karakter.";
            isValid = false;
        }

        if (isValid)
        {
            return true;
        }

        ErrorMessage = "Periksa kembali input login.";
        IsProgressError = true;
        IsProgressIndeterminate = false;
        ProgressValue = 0;
        ProgressAlertMessage = "Validasi gagal. Perbaiki input lalu coba lagi.";
        return false;
    }

    private void ClearInputErrors()
    {
        ErrorMessage = string.Empty;
        EmailErrorMessage = string.Empty;
        PasswordErrorMessage = string.Empty;
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var mailAddress = new MailAddress(email);
            return mailAddress.Address.Equals(email, StringComparison.OrdinalIgnoreCase);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private void RaiseLoginCanExecuteChanged()
    {
        if (LoginCommand is AsyncRelayCommand asyncRelayCommand)
        {
            asyncRelayCommand.RaiseCanExecuteChanged();
        }
    }
}
