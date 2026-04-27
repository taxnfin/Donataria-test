from conftest import TEST_EMAIL, TEST_PASSWORD, BASE_URL
"""
Iteration 5 Tests: Report PDF, Logo Upload, Audit Log
Tests for new features:
1. GET /api/reportes/{report_id}/pdf - PDF generation
2. POST /api/organizacion/logo - Logo upload
3. DELETE /api/organizacion/logo - Logo delete
4. GET /api/auditoria - Audit log listing
5. GET /api/auditoria/export - CSV export
6. Audit log entries created on donante/donativo/cfdi/report creation
"""

import pytest
import requests
import os
import io
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication for tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        
        # Login with test credentials
        login_response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@donataria.org",
            "password": "Test1234!"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed - skipping tests")
        
        # Extract session cookie
        return s
    
    def test_login_success(self, session):
        """Verify login works"""
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "organizacion_id" in data
        print(f"✓ Logged in as {data['email']}")


class TestLogoUpload:
    """Test organization logo upload/delete"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        login_response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@donataria.org",
            "password": "Test1234!"
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return s
    
    def test_logo_upload_png(self, session):
        """POST /api/organizacion/logo accepts PNG file"""
        # Create a minimal valid PNG (1x1 pixel transparent)
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 dimensions
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,  # bit depth, color type
            0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,  # compressed data
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,  # CRC
            0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,  # IEND chunk
            0xAE, 0x42, 0x60, 0x82                           # IEND CRC
        ])
        
        files = {'file': ('test_logo.png', io.BytesIO(png_data), 'image/png')}
        response = session.post(f"{BASE_URL}/api/organizacion/logo", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "logo_url" in data
        assert data["logo_url"].startswith("data:image/png;base64,")
        print(f"✓ Logo uploaded successfully, data URI length: {len(data['logo_url'])}")
    
    def test_logo_appears_in_organizacion(self, session):
        """Verify logo_url is returned in organization data"""
        response = session.get(f"{BASE_URL}/api/organizacion")
        assert response.status_code == 200
        data = response.json()
        # Logo should be present after upload
        assert "logo_url" in data
        print(f"✓ Logo URL present in organization data")
    
    def test_logo_delete(self, session):
        """DELETE /api/organizacion/logo removes logo"""
        response = session.delete(f"{BASE_URL}/api/organizacion/logo")
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Logo eliminado"
        
        # Verify logo is removed
        org_response = session.get(f"{BASE_URL}/api/organizacion")
        org_data = org_response.json()
        assert org_data.get("logo_url") is None
        print("✓ Logo deleted successfully")
    
    def test_logo_upload_invalid_type(self, session):
        """POST /api/organizacion/logo rejects non-image files"""
        files = {'file': ('test.txt', io.BytesIO(b'not an image'), 'text/plain')}
        response = session.post(f"{BASE_URL}/api/organizacion/logo", files=files)
        assert response.status_code == 400
        print("✓ Invalid file type rejected correctly")


class TestAuditLog:
    """Test audit log endpoints"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        login_response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@donataria.org",
            "password": "Test1234!"
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return s
    
    def test_get_audit_log(self, session):
        """GET /api/auditoria returns paginated logs"""
        response = session.get(f"{BASE_URL}/api/auditoria")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "logs" in data
        assert isinstance(data["logs"], list)
        print(f"✓ Audit log returned {data['total']} total entries, {len(data['logs'])} in page")
    
    def test_audit_log_filter_by_entidad(self, session):
        """GET /api/auditoria?entidad=donante filters correctly"""
        response = session.get(f"{BASE_URL}/api/auditoria?entidad=donante")
        assert response.status_code == 200
        data = response.json()
        # All returned logs should be for donante entity
        for log in data["logs"]:
            assert log["entidad"] == "donante"
        print(f"✓ Filter by entidad=donante works, {len(data['logs'])} entries")
    
    def test_audit_log_filter_by_accion(self, session):
        """GET /api/auditoria?accion=crear filters correctly"""
        response = session.get(f"{BASE_URL}/api/auditoria?accion=crear")
        assert response.status_code == 200
        data = response.json()
        for log in data["logs"]:
            assert log["accion"] == "crear"
        print(f"✓ Filter by accion=crear works, {len(data['logs'])} entries")
    
    def test_audit_log_pagination(self, session):
        """GET /api/auditoria supports skip/limit"""
        response = session.get(f"{BASE_URL}/api/auditoria?limit=5&skip=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data["logs"]) <= 5
        print(f"✓ Pagination works, returned {len(data['logs'])} entries with limit=5")
    
    def test_audit_log_export_csv(self, session):
        """GET /api/auditoria/export returns CSV file"""
        response = session.get(f"{BASE_URL}/api/auditoria/export")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("Content-Type", "")
        assert "attachment" in response.headers.get("Content-Disposition", "")
        
        # Verify CSV content
        content = response.text
        assert "Fecha,Usuario,Acción,Entidad,ID Entidad,Detalles" in content
        print(f"✓ CSV export works, {len(content)} bytes")


class TestAuditLogCreation:
    """Test that actions create audit log entries"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        login_response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@donataria.org",
            "password": "Test1234!"
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return s
    
    def test_create_donante_triggers_audit(self, session):
        """Creating a donante creates audit log entry"""
        # Get initial audit count for donante
        initial = session.get(f"{BASE_URL}/api/auditoria?entidad=donante&accion=crear").json()
        initial_count = initial["total"]
        
        # Create a donante
        donante_data = {
            "nombre": f"TEST_Audit_Donante_{datetime.now().timestamp()}",
            "tipo_persona": "fisica",
            "rfc": "XAXX010101000",
            "es_extranjero": False,
            "email": "audit_test@example.com"
        }
        create_response = session.post(f"{BASE_URL}/api/donantes", json=donante_data)
        assert create_response.status_code == 200
        donante_id = create_response.json()["donante_id"]
        
        # Check audit log
        after = session.get(f"{BASE_URL}/api/auditoria?entidad=donante&accion=crear").json()
        assert after["total"] > initial_count
        
        # Verify the latest entry
        latest = after["logs"][0]
        assert latest["entidad"] == "donante"
        assert latest["accion"] == "crear"
        assert latest["entidad_id"] == donante_id
        print(f"✓ Donante creation triggered audit log entry")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/donantes/{donante_id}")
    
    def test_create_donativo_triggers_audit(self, session):
        """Creating a donativo creates audit log entry"""
        # First create a donante
        donante_data = {
            "nombre": f"TEST_Donativo_Audit_{datetime.now().timestamp()}",
            "tipo_persona": "fisica",
            "es_extranjero": False
        }
        donante_response = session.post(f"{BASE_URL}/api/donantes", json=donante_data)
        donante_id = donante_response.json()["donante_id"]
        
        # Get initial audit count
        initial = session.get(f"{BASE_URL}/api/auditoria?entidad=donativo&accion=crear").json()
        initial_count = initial["total"]
        
        # Create donativo
        donativo_data = {
            "donante_id": donante_id,
            "monto": 1000.00,
            "moneda": "MXN",
            "tipo_donativo": "no_oneroso",
            "fecha_donativo": datetime.now(timezone.utc).isoformat()
        }
        donativo_response = session.post(f"{BASE_URL}/api/donativos", json=donativo_data)
        assert donativo_response.status_code == 200
        donativo_id = donativo_response.json()["donativo_id"]
        
        # Check audit log
        after = session.get(f"{BASE_URL}/api/auditoria?entidad=donativo&accion=crear").json()
        assert after["total"] > initial_count
        
        latest = after["logs"][0]
        assert latest["entidad"] == "donativo"
        assert latest["accion"] == "crear"
        print(f"✓ Donativo creation triggered audit log entry")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/donativos/{donativo_id}")
        session.delete(f"{BASE_URL}/api/donantes/{donante_id}")
    
    def test_create_cfdi_triggers_audit(self, session):
        """Creating a CFDI creates audit log entry"""
        # Create donante and donativo first
        donante_data = {
            "nombre": f"TEST_CFDI_Audit_{datetime.now().timestamp()}",
            "tipo_persona": "fisica",
            "rfc": "XAXX010101000",
            "es_extranjero": False
        }
        donante_response = session.post(f"{BASE_URL}/api/donantes", json=donante_data)
        donante_id = donante_response.json()["donante_id"]
        
        donativo_data = {
            "donante_id": donante_id,
            "monto": 5000.00,
            "moneda": "MXN",
            "tipo_donativo": "no_oneroso",
            "fecha_donativo": datetime.now(timezone.utc).isoformat()
        }
        donativo_response = session.post(f"{BASE_URL}/api/donativos", json=donativo_data)
        donativo_id = donativo_response.json()["donativo_id"]
        
        # Get initial audit count
        initial = session.get(f"{BASE_URL}/api/auditoria?entidad=cfdi&accion=crear").json()
        initial_count = initial["total"]
        
        # Create CFDI
        cfdi_data = {
            "donativo_id": donativo_id,
            "donante_id": donante_id,
            "monto": 5000.00,
            "moneda": "MXN",
            "tipo_donativo": "no_oneroso"
        }
        cfdi_response = session.post(f"{BASE_URL}/api/cfdis", json=cfdi_data)
        assert cfdi_response.status_code == 200
        cfdi_id = cfdi_response.json()["cfdi_id"]
        
        # Check audit log
        after = session.get(f"{BASE_URL}/api/auditoria?entidad=cfdi&accion=crear").json()
        assert after["total"] > initial_count
        
        latest = after["logs"][0]
        assert latest["entidad"] == "cfdi"
        assert latest["accion"] == "crear"
        print(f"✓ CFDI creation triggered audit log entry")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/donantes/{donante_id}")


class TestReportPDF:
    """Test report PDF generation"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        login_response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@donataria.org",
            "password": "Test1234!"
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return s
    
    def test_create_report_triggers_audit(self, session):
        """Creating a report creates audit log entry"""
        # Get initial audit count
        initial = session.get(f"{BASE_URL}/api/auditoria?entidad=reporte&accion=crear").json()
        initial_count = initial["total"]
        
        # Create a report
        report_data = {
            "titulo": f"TEST_Report_PDF_{datetime.now().timestamp()}",
            "tipo": "reporte_mensual",
            "descripcion": "Test report for PDF generation",
            "destinatario": "interno",
            "periodo_inicio": "2026-01-01T00:00:00Z",
            "periodo_fin": "2026-01-31T23:59:59Z"
        }
        create_response = session.post(f"{BASE_URL}/api/reportes", json=report_data)
        assert create_response.status_code == 200
        report_id = create_response.json()["report_id"]
        
        # Check audit log
        after = session.get(f"{BASE_URL}/api/auditoria?entidad=reporte&accion=crear").json()
        assert after["total"] > initial_count
        print(f"✓ Report creation triggered audit log entry")
        
        return report_id
    
    def test_get_report_pdf(self, session):
        """GET /api/reportes/{report_id}/pdf returns valid PDF"""
        # First create a report
        report_data = {
            "titulo": f"TEST_PDF_Download_{datetime.now().timestamp()}",
            "tipo": "str_sar",
            "descripcion": "Test report for PDF download",
            "destinatario": "UIF",
            "periodo_inicio": "2026-01-01T00:00:00Z",
            "periodo_fin": "2026-01-31T23:59:59Z"
        }
        create_response = session.post(f"{BASE_URL}/api/reportes", json=report_data)
        assert create_response.status_code == 200
        report_id = create_response.json()["report_id"]
        
        # Get PDF
        pdf_response = session.get(f"{BASE_URL}/api/reportes/{report_id}/pdf")
        assert pdf_response.status_code == 200
        assert "application/pdf" in pdf_response.headers.get("Content-Type", "")
        
        # Verify PDF content starts with PDF signature
        content = pdf_response.content
        assert content[:4] == b'%PDF'
        print(f"✓ PDF generated successfully, {len(content)} bytes")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/reportes/{report_id}")
    
    def test_get_report_pdf_not_found(self, session):
        """GET /api/reportes/{invalid_id}/pdf returns 404"""
        response = session.get(f"{BASE_URL}/api/reportes/invalid_report_id/pdf")
        assert response.status_code == 404
        print("✓ Invalid report ID returns 404")


class TestPlantillasUse:
    """Test using templates to generate reports"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        login_response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@donataria.org",
            "password": "Test1234!"
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        return s
    
    def test_create_plantilla(self, session):
        """Create a report template"""
        plantilla_data = {
            "nombre": f"TEST_Template_{datetime.now().timestamp()}",
            "tipo_reporte": "reporte_mensual",
            "descripcion": "Test template",
            "criterios": {},
            "formato": "PDF",
            "destinatario": "interno",
            "periodicidad": "mensual"
        }
        response = session.post(f"{BASE_URL}/api/reportes/plantillas", json=plantilla_data)
        assert response.status_code == 200
        data = response.json()
        assert "template_id" in data
        print(f"✓ Template created: {data['template_id']}")
        return data["template_id"]
    
    def test_list_plantillas(self, session):
        """GET /api/reportes/plantillas returns templates"""
        response = session.get(f"{BASE_URL}/api/reportes/plantillas")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} templates")
    
    def test_create_report_from_template(self, session):
        """Create report using template_id"""
        # First create a template
        plantilla_data = {
            "nombre": f"TEST_UseTemplate_{datetime.now().timestamp()}",
            "tipo_reporte": "donantes_pep",
            "descripcion": "Template for PEP reports",
            "formato": "PDF",
            "destinatario": "UIF",
            "periodicidad": "manual"
        }
        template_response = session.post(f"{BASE_URL}/api/reportes/plantillas", json=plantilla_data)
        template_id = template_response.json()["template_id"]
        
        # Create report using template
        report_data = {
            "template_id": template_id,
            "titulo": f"Report from Template {datetime.now().timestamp()}",
            "tipo": "donantes_pep",
            "destinatario": "UIF",
            "periodo_inicio": "2026-01-01T00:00:00Z",
            "periodo_fin": "2026-01-31T23:59:59Z"
        }
        report_response = session.post(f"{BASE_URL}/api/reportes", json=report_data)
        assert report_response.status_code == 200
        report = report_response.json()
        assert report.get("template_id") == template_id
        print(f"✓ Report created from template: {report['report_id']}")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/reportes/{report['report_id']}")
        session.delete(f"{BASE_URL}/api/reportes/plantillas/{template_id}")


class TestAuditLogRequiresAuth:
    """Test that audit endpoints require authentication"""
    
    def test_auditoria_requires_auth(self):
        """GET /api/auditoria returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/auditoria")
        assert response.status_code == 401
        print("✓ /api/auditoria requires authentication")
    
    def test_auditoria_export_requires_auth(self):
        """GET /api/auditoria/export returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/auditoria/export")
        assert response.status_code == 401
        print("✓ /api/auditoria/export requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
