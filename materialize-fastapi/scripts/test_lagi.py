from app.services.inv_ap2_service import INVAp2Service


def test_print_output(capsys):
    INVAp2Service.get_data_inv()
    captured = capsys.readouterr()
    assert "get_data_inv" in captured.out
