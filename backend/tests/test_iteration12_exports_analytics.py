"""
Iteration 12 Tests: PDF Export, CSV/Report Export, Advanced Analytics
Tests for:
1. GET /api/dashboard/ficha-publica/pdf - PDF export of ficha publica
2. GET /api/pld/avisos/export/csv - CSV export of avisos UIF
3. GET /api/pld/avisos/export/reporte - Text report export of avisos UIF
4. GET /api/dashboard/analytics - Advanced analytics with 12-month trends
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@donataria.org"
TEST_PASSWORD = "Test1234!"


@pytest.fixture(scope="module")
def auth_session():
    """Create authenticated session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    return session


class TestFichaPDFExport:
    """Tests for Ficha Publica PDF export endpoint"""
    
    def test_ficha_pdf_returns_200(self, auth_session):
        """GET /api/dashboard/ficha-publica/pdf returns 200"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/ficha-publica/pdf")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_ficha_pdf_content_type(self, auth_session):
        """GET /api/dashboard/ficha-publica/pdf returns application/pdf content type"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/ficha-publica/pdf")
        assert response.status_code == 200
        content_type = response.headers.get("Content-Type", "")
        assert "application/pdf" in content_type, f"Expected application/pdf, got {content_type}"
    
    def test_ficha_pdf_has_content_disposition(self, auth_session):
        """GET /api/dashboard/ficha-publica/pdf has Content-Disposition header"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/ficha-publica/pdf")
        assert response.status_code == 200
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp, f"Expected attachment, got {content_disp}"
        assert ".pdf" in content_disp, f"Expected .pdf in filename, got {content_disp}"
    
    def test_ficha_pdf_has_content(self, auth_session):
        """GET /api/dashboard/ficha-publica/pdf returns non-empty PDF"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/ficha-publica/pdf")
        assert response.status_code == 200
        assert len(response.content) > 1000, f"PDF too small: {len(response.content)} bytes"
        # Check PDF magic bytes
        assert response.content[:4] == b'%PDF', "Response is not a valid PDF"
    
    def test_ficha_pdf_unauthenticated_returns_401(self):
        """GET /api/dashboard/ficha-publica/pdf without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/dashboard/ficha-publica/pdf")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAvisosCSVExport:
    """Tests for Avisos UIF CSV export endpoint"""
    
    def test_avisos_csv_returns_200(self, auth_session):
        """GET /api/pld/avisos/export/csv returns 200"""
        response = auth_session.get(f"{BASE_URL}/api/pld/avisos/export/csv")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_avisos_csv_content_type(self, auth_session):
        """GET /api/pld/avisos/export/csv returns text/csv content type"""
        response = auth_session.get(f"{BASE_URL}/api/pld/avisos/export/csv")
        assert response.status_code == 200
        content_type = response.headers.get("Content-Type", "")
        assert "text/csv" in content_type, f"Expected text/csv, got {content_type}"
    
    def test_avisos_csv_has_content_disposition(self, auth_session):
        """GET /api/pld/avisos/export/csv has Content-Disposition header"""
        response = auth_session.get(f"{BASE_URL}/api/pld/avisos/export/csv")
        assert response.status_code == 200
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp, f"Expected attachment, got {content_disp}"
        assert ".csv" in content_disp, f"Expected .csv in filename, got {content_disp}"
    
    def test_avisos_csv_has_utf8_bom(self, auth_session):
        """GET /api/pld/avisos/export/csv has UTF-8 BOM for Excel compatibility"""
        response = auth_session.get(f"{BASE_URL}/api/pld/avisos/export/csv")
        assert response.status_code == 200
        # UTF-8 BOM is EF BB BF
        assert response.content[:3] == b'\xef\xbb\xbf', "CSV should have UTF-8 BOM"
    
    def test_avisos_csv_has_header_row(self, auth_session):
        """GET /api/pld/avisos/export/csv has proper header row"""
        response = auth_session.get(f"{BASE_URL}/api/pld/avisos/export/csv")
        assert response.status_code == 200
        content = response.content.decode('utf-8-sig')
        first_line = content.split('\n')[0]
        assert "No." in first_line, "Header should contain 'No.'"
        assert "Tipo de Aviso" in first_line, "Header should contain 'Tipo de Aviso'"
        assert "Numero de Folio" in first_line, "Header should contain 'Numero de Folio'"
        assert "Monto" in first_line, "Header should contain 'Monto'"
    
    def test_avisos_csv_unauthenticated_returns_401(self):
        """GET /api/pld/avisos/export/csv without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/pld/avisos/export/csv")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAvisosReporteExport:
    """Tests for Avisos UIF text report export endpoint"""
    
    def test_avisos_reporte_returns_200(self, auth_session):
        """GET /api/pld/avisos/export/reporte returns 200"""
        response = auth_session.get(f"{BASE_URL}/api/pld/avisos/export/reporte")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_avisos_reporte_content_type(self, auth_session):
        """GET /api/pld/avisos/export/reporte returns text/plain content type"""
        response = auth_session.get(f"{BASE_URL}/api/pld/avisos/export/reporte")
        assert response.status_code == 200
        content_type = response.headers.get("Content-Type", "")
        assert "text/plain" in content_type, f"Expected text/plain, got {content_type}"
    
    def test_avisos_reporte_has_content_disposition(self, auth_session):
        """GET /api/pld/avisos/export/reporte has Content-Disposition header"""
        response = auth_session.get(f"{BASE_URL}/api/pld/avisos/export/reporte")
        assert response.status_code == 200
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp, f"Expected attachment, got {content_disp}"
        assert ".txt" in content_disp, f"Expected .txt in filename, got {content_disp}"
    
    def test_avisos_reporte_has_header(self, auth_session):
        """GET /api/pld/avisos/export/reporte has proper report header"""
        response = auth_session.get(f"{BASE_URL}/api/pld/avisos/export/reporte")
        assert response.status_code == 200
        content = response.content.decode('utf-8')
        assert "REPORTE DE AVISOS PRESENTADOS ANTE LA UIF" in content, "Report should have title"
        assert "Organizacion:" in content, "Report should have organization"
        assert "RFC:" in content, "Report should have RFC"
    
    def test_avisos_reporte_has_summary(self, auth_session):
        """GET /api/pld/avisos/export/reporte has summary section"""
        response = auth_session.get(f"{BASE_URL}/api/pld/avisos/export/reporte")
        assert response.status_code == 200
        content = response.content.decode('utf-8')
        assert "RESUMEN" in content, "Report should have RESUMEN section"
        assert "Total de avisos:" in content, "Report should have total count"
    
    def test_avisos_reporte_unauthenticated_returns_401(self):
        """GET /api/pld/avisos/export/reporte without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/pld/avisos/export/reporte")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAdvancedAnalytics:
    """Tests for Advanced Analytics endpoint"""
    
    def test_analytics_returns_200(self, auth_session):
        """GET /api/dashboard/analytics returns 200"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_analytics_has_tendencias(self, auth_session):
        """GET /api/dashboard/analytics has tendencias object"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        assert "tendencias" in data, "Response should have tendencias"
    
    def test_analytics_tendencias_has_4_arrays(self, auth_session):
        """GET /api/dashboard/analytics tendencias has 4 arrays"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        tendencias = data.get("tendencias", {})
        assert "donativos_mensual" in tendencias, "tendencias should have donativos_mensual"
        assert "donantes_crecimiento" in tendencias, "tendencias should have donantes_crecimiento"
        assert "cfdis_mensual" in tendencias, "tendencias should have cfdis_mensual"
        assert "alertas_mensual" in tendencias, "tendencias should have alertas_mensual"
    
    def test_analytics_donativos_mensual_has_12_entries(self, auth_session):
        """GET /api/dashboard/analytics tendencias.donativos_mensual has 12 entries"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        donativos_mensual = data.get("tendencias", {}).get("donativos_mensual", [])
        assert len(donativos_mensual) == 12, f"Expected 12 entries, got {len(donativos_mensual)}"
    
    def test_analytics_donantes_crecimiento_has_12_entries(self, auth_session):
        """GET /api/dashboard/analytics tendencias.donantes_crecimiento has 12 entries"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        donantes_crecimiento = data.get("tendencias", {}).get("donantes_crecimiento", [])
        assert len(donantes_crecimiento) == 12, f"Expected 12 entries, got {len(donantes_crecimiento)}"
    
    def test_analytics_cfdis_mensual_has_12_entries(self, auth_session):
        """GET /api/dashboard/analytics tendencias.cfdis_mensual has 12 entries"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        cfdis_mensual = data.get("tendencias", {}).get("cfdis_mensual", [])
        assert len(cfdis_mensual) == 12, f"Expected 12 entries, got {len(cfdis_mensual)}"
    
    def test_analytics_alertas_mensual_has_12_entries(self, auth_session):
        """GET /api/dashboard/analytics tendencias.alertas_mensual has 12 entries"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        alertas_mensual = data.get("tendencias", {}).get("alertas_mensual", [])
        assert len(alertas_mensual) == 12, f"Expected 12 entries, got {len(alertas_mensual)}"
    
    def test_analytics_has_comparativa_anual(self, auth_session):
        """GET /api/dashboard/analytics has comparativa_anual"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        assert "comparativa_anual" in data, "Response should have comparativa_anual"
    
    def test_analytics_comparativa_has_variacion_pct(self, auth_session):
        """GET /api/dashboard/analytics comparativa_anual has variacion_pct"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        comparativa = data.get("comparativa_anual", {})
        assert "variacion_pct" in comparativa, "comparativa_anual should have variacion_pct"
        assert isinstance(comparativa["variacion_pct"], (int, float)), "variacion_pct should be numeric"
    
    def test_analytics_comparativa_has_yoy_fields(self, auth_session):
        """GET /api/dashboard/analytics comparativa_anual has YoY comparison fields"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        comparativa = data.get("comparativa_anual", {})
        assert "donativos_actual" in comparativa, "comparativa should have donativos_actual"
        assert "donativos_anterior" in comparativa, "comparativa should have donativos_anterior"
        assert "donantes_nuevos_actual" in comparativa, "comparativa should have donantes_nuevos_actual"
        assert "donantes_nuevos_anterior" in comparativa, "comparativa should have donantes_nuevos_anterior"
    
    def test_analytics_has_metricas(self, auth_session):
        """GET /api/dashboard/analytics has metricas"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        assert "metricas" in data, "Response should have metricas"
    
    def test_analytics_metricas_has_promedio_donativo(self, auth_session):
        """GET /api/dashboard/analytics metricas has promedio_donativo"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        metricas = data.get("metricas", {})
        assert "promedio_donativo" in metricas, "metricas should have promedio_donativo"
        assert isinstance(metricas["promedio_donativo"], (int, float)), "promedio_donativo should be numeric"
    
    def test_analytics_metricas_has_totals(self, auth_session):
        """GET /api/dashboard/analytics metricas has total counts"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        metricas = data.get("metricas", {})
        assert "total_donantes" in metricas, "metricas should have total_donantes"
        assert "total_donativos" in metricas, "metricas should have total_donativos"
        assert "total_cfdis" in metricas, "metricas should have total_cfdis"
        assert "total_alertas" in metricas, "metricas should have total_alertas"
    
    def test_analytics_donativos_entry_structure(self, auth_session):
        """GET /api/dashboard/analytics donativos_mensual entries have correct structure"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        donativos_mensual = data.get("tendencias", {}).get("donativos_mensual", [])
        if donativos_mensual:
            entry = donativos_mensual[0]
            assert "label" in entry, "Entry should have label"
            assert "mes" in entry, "Entry should have mes"
            assert "year" in entry, "Entry should have year"
            assert "monto" in entry, "Entry should have monto"
            assert "cantidad" in entry, "Entry should have cantidad"
    
    def test_analytics_unauthenticated_returns_401(self):
        """GET /api/dashboard/analytics without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
