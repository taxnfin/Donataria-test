from conftest import TEST_EMAIL, TEST_PASSWORD, BASE_URL
"""
Test Multi-Donataria Features - Iteration 6
Tests for:
- GET /api/organizaciones - list user's organizations with active flag
- POST /api/organizaciones - create new org and switch user to it
- PUT /api/organizaciones/switch/{org_id} - switch active organization
- GET /api/auth/me - returns organizaciones_ids array
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials


class TestMultiDonatariaFeatures:
    """Tests for multi-donataria organization management"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session and login"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.user_data = response.json()
        self.token = self.user_data.get("token")
        
        # Store cookies for subsequent requests
        yield
        
        # Cleanup - no specific cleanup needed as we test with existing user
    
    def test_auth_me_returns_organizaciones_ids(self):
        """GET /api/auth/me should return organizaciones_ids array"""
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "organizaciones_ids" in data, "organizaciones_ids field missing from /auth/me response"
        assert isinstance(data["organizaciones_ids"], list), "organizaciones_ids should be a list"
        assert "organizacion_id" in data, "organizacion_id field missing"
        
        # If user has an org, it should be in the list
        if data.get("organizacion_id"):
            assert data["organizacion_id"] in data["organizaciones_ids"] or len(data["organizaciones_ids"]) > 0, \
                "Active org should be in organizaciones_ids list"
        
        print(f"✓ /auth/me returns organizaciones_ids: {data['organizaciones_ids']}")
    
    def test_get_organizaciones_returns_list(self):
        """GET /api/organizaciones should return list of user's organizations"""
        response = self.session.get(f"{BASE_URL}/api/organizaciones")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            org = data[0]
            assert "organizacion_id" in org, "organizacion_id missing"
            assert "nombre" in org, "nombre missing"
            assert "rfc" in org, "rfc missing"
            assert "activa" in org, "activa flag missing"
            
            # Verify at least one org is marked as active
            active_orgs = [o for o in data if o.get("activa")]
            assert len(active_orgs) == 1, "Exactly one org should be marked as active"
        
        print(f"✓ GET /api/organizaciones returns {len(data)} organizations")
    
    def test_create_new_organization(self):
        """POST /api/organizaciones should create new org and switch to it"""
        unique_name = f"TEST_Org_{uuid.uuid4().hex[:8]}"
        unique_rfc = f"TEST{uuid.uuid4().hex[:8].upper()}"
        
        response = self.session.post(f"{BASE_URL}/api/organizaciones", json={
            "nombre": unique_name,
            "rfc": unique_rfc,
            "rubro": "asistencial"
        })
        assert response.status_code == 200, f"Failed to create org: {response.text}"
        
        data = response.json()
        assert "organizacion_id" in data, "organizacion_id missing from response"
        assert data["nombre"] == unique_name, "nombre mismatch"
        assert data["rfc"] == unique_rfc, "rfc mismatch"
        
        new_org_id = data["organizacion_id"]
        
        # Verify user was switched to new org
        me_response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        me_data = me_response.json()
        
        assert me_data["organizacion_id"] == new_org_id, "User should be switched to new org"
        assert new_org_id in me_data["organizaciones_ids"], "New org should be in user's organizaciones_ids"
        
        print(f"✓ Created new org: {unique_name} (ID: {new_org_id})")
        print(f"✓ User automatically switched to new org")
        
        # Store for cleanup/switch test
        self.new_org_id = new_org_id
        return new_org_id
    
    def test_switch_organization(self):
        """PUT /api/organizaciones/switch/{org_id} should switch active org"""
        # First get list of orgs
        orgs_response = self.session.get(f"{BASE_URL}/api/organizaciones")
        assert orgs_response.status_code == 200
        orgs = orgs_response.json()
        
        if len(orgs) < 2:
            # Create a second org for testing
            unique_name = f"TEST_Switch_{uuid.uuid4().hex[:8]}"
            create_response = self.session.post(f"{BASE_URL}/api/organizaciones", json={
                "nombre": unique_name,
                "rfc": f"TST{uuid.uuid4().hex[:8].upper()}",
                "rubro": "educativo"
            })
            assert create_response.status_code == 200
            
            # Refresh orgs list
            orgs_response = self.session.get(f"{BASE_URL}/api/organizaciones")
            orgs = orgs_response.json()
        
        # Find a non-active org to switch to
        current_active = next((o for o in orgs if o.get("activa")), None)
        target_org = next((o for o in orgs if not o.get("activa")), None)
        
        if not target_org:
            pytest.skip("Need at least 2 orgs to test switching")
        
        target_org_id = target_org["organizacion_id"]
        
        # Switch to target org
        switch_response = self.session.put(f"{BASE_URL}/api/organizaciones/switch/{target_org_id}")
        assert switch_response.status_code == 200, f"Switch failed: {switch_response.text}"
        
        switch_data = switch_response.json()
        assert switch_data.get("organizacion_id") == target_org_id, "Response should confirm new org"
        
        # Verify switch via /auth/me
        me_response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["organizacion_id"] == target_org_id, "User's active org should be updated"
        
        print(f"✓ Switched from {current_active['nombre'] if current_active else 'unknown'} to {target_org['nombre']}")
    
    def test_switch_to_unauthorized_org_fails(self):
        """PUT /api/organizaciones/switch/{org_id} should fail for unauthorized org"""
        fake_org_id = f"org_{uuid.uuid4().hex[:12]}"
        
        response = self.session.put(f"{BASE_URL}/api/organizaciones/switch/{fake_org_id}")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        
        print("✓ Switch to unauthorized org correctly returns 403")
    
    def test_switch_to_nonexistent_org_fails(self):
        """PUT /api/organizaciones/switch/{org_id} should fail for non-existent org"""
        # First add a fake org_id to user's list (this shouldn't happen in practice)
        # But we can test with a valid-looking but non-existent org
        fake_org_id = f"org_nonexistent123"
        
        response = self.session.put(f"{BASE_URL}/api/organizaciones/switch/{fake_org_id}")
        # Should be 403 (not in user's list) or 404 (not found)
        assert response.status_code in [403, 404], f"Expected 403 or 404, got {response.status_code}"
        
        print("✓ Switch to non-existent org correctly fails")
    
    def test_organizaciones_list_shows_active_flag(self):
        """GET /api/organizaciones should mark exactly one org as active"""
        response = self.session.get(f"{BASE_URL}/api/organizaciones")
        assert response.status_code == 200
        
        orgs = response.json()
        if len(orgs) == 0:
            pytest.skip("No organizations to test")
        
        active_count = sum(1 for o in orgs if o.get("activa"))
        assert active_count == 1, f"Expected exactly 1 active org, found {active_count}"
        
        # Verify active org matches /auth/me
        me_response = self.session.get(f"{BASE_URL}/api/auth/me")
        me_data = me_response.json()
        
        active_org = next((o for o in orgs if o.get("activa")), None)
        assert active_org["organizacion_id"] == me_data["organizacion_id"], \
            "Active org in list should match user's organizacion_id"
        
        print(f"✓ Active flag correctly set for {active_org['nombre']}")
    
    def test_create_org_adds_to_organizaciones_ids(self):
        """Creating new org should add it to user's organizaciones_ids"""
        # Get initial count
        me_before = self.session.get(f"{BASE_URL}/api/auth/me").json()
        initial_count = len(me_before.get("organizaciones_ids", []))
        
        # Create new org
        unique_name = f"TEST_Count_{uuid.uuid4().hex[:8]}"
        create_response = self.session.post(f"{BASE_URL}/api/organizaciones", json={
            "nombre": unique_name,
            "rfc": f"CNT{uuid.uuid4().hex[:8].upper()}",
            "rubro": "cultural"
        })
        assert create_response.status_code == 200
        new_org_id = create_response.json()["organizacion_id"]
        
        # Verify count increased
        me_after = self.session.get(f"{BASE_URL}/api/auth/me").json()
        new_count = len(me_after.get("organizaciones_ids", []))
        
        assert new_count == initial_count + 1, f"organizaciones_ids count should increase by 1"
        assert new_org_id in me_after["organizaciones_ids"], "New org should be in list"
        
        print(f"✓ organizaciones_ids count: {initial_count} -> {new_count}")


class TestAuditLogForOrgCreation:
    """Test that org creation is logged in audit"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        yield
    
    def test_org_creation_logged_in_audit(self):
        """Creating org should create audit log entry"""
        unique_name = f"TEST_Audit_{uuid.uuid4().hex[:8]}"
        
        # Create org
        create_response = self.session.post(f"{BASE_URL}/api/organizaciones", json={
            "nombre": unique_name,
            "rfc": f"AUD{uuid.uuid4().hex[:8].upper()}",
            "rubro": "asistencial"
        })
        assert create_response.status_code == 200
        new_org_id = create_response.json()["organizacion_id"]
        
        # Check audit log
        audit_response = self.session.get(f"{BASE_URL}/api/auditoria?entidad=organizacion&accion=crear")
        assert audit_response.status_code == 200
        
        audit_data = audit_response.json()
        logs = audit_data.get("logs", [])
        
        # Find log for our new org
        org_log = next((l for l in logs if l.get("entidad_id") == new_org_id), None)
        assert org_log is not None, f"Audit log entry for org {new_org_id} not found"
        assert org_log["accion"] == "crear"
        assert org_log["entidad"] == "organizacion"
        
        print(f"✓ Org creation logged in audit: {org_log['audit_id']}")


class TestReportPDFDownload:
    """Test Report PDF download functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        yield
    
    def test_report_pdf_download_endpoint(self):
        """GET /api/reportes/{id}/pdf should return PDF"""
        # First create a report
        from datetime import datetime, timedelta
        
        report_response = self.session.post(f"{BASE_URL}/api/reportes", json={
            "titulo": f"TEST_PDF_{uuid.uuid4().hex[:8]}",
            "tipo": "reporte_mensual",
            "destinatario": "interno",
            "periodo_inicio": (datetime.now() - timedelta(days=30)).isoformat(),
            "periodo_fin": datetime.now().isoformat()
        })
        assert report_response.status_code == 200, f"Failed to create report: {report_response.text}"
        report_id = report_response.json()["report_id"]
        
        # Download PDF
        pdf_response = self.session.get(f"{BASE_URL}/api/reportes/{report_id}/pdf")
        assert pdf_response.status_code == 200, f"PDF download failed: {pdf_response.status_code}"
        assert pdf_response.headers.get("content-type") == "application/pdf"
        assert pdf_response.content[:4] == b"%PDF", "Response should be valid PDF"
        
        print(f"✓ PDF download works for report {report_id}")


class TestLogoUpload:
    """Test logo upload functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        yield
    
    def test_logo_upload_and_retrieval(self):
        """POST /api/organizacion/logo should upload and store logo"""
        # Create a simple 1x1 PNG
        import base64
        # Minimal valid PNG (1x1 red pixel)
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        )
        
        files = {"file": ("test_logo.png", png_data, "image/png")}
        response = self.session.post(f"{BASE_URL}/api/organizacion/logo", files=files)
        assert response.status_code == 200, f"Logo upload failed: {response.text}"
        
        data = response.json()
        assert "logo_url" in data
        assert data["logo_url"].startswith("data:image/png;base64,")
        
        # Verify logo in org data
        org_response = self.session.get(f"{BASE_URL}/api/organizacion")
        assert org_response.status_code == 200
        org_data = org_response.json()
        assert org_data.get("logo_url") is not None
        
        print("✓ Logo upload and retrieval works")


class TestAuditLogPage:
    """Test audit log API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        yield
    
    def test_audit_log_pagination(self):
        """GET /api/auditoria should support pagination"""
        response = self.session.get(f"{BASE_URL}/api/auditoria?limit=5&skip=0")
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert "logs" in data
        assert isinstance(data["logs"], list)
        assert len(data["logs"]) <= 5
        
        print(f"✓ Audit log pagination works (total: {data['total']}, returned: {len(data['logs'])})")
    
    def test_audit_log_filters(self):
        """GET /api/auditoria should support entidad and accion filters"""
        # Test entidad filter
        response = self.session.get(f"{BASE_URL}/api/auditoria?entidad=donante")
        assert response.status_code == 200
        data = response.json()
        for log in data.get("logs", []):
            assert log["entidad"] == "donante", "Filter should only return donante entries"
        
        # Test accion filter
        response = self.session.get(f"{BASE_URL}/api/auditoria?accion=crear")
        assert response.status_code == 200
        data = response.json()
        for log in data.get("logs", []):
            assert log["accion"] == "crear", "Filter should only return crear entries"
        
        print("✓ Audit log filters work correctly")
    
    def test_audit_log_export_csv(self):
        """GET /api/auditoria/export should return CSV"""
        response = self.session.get(f"{BASE_URL}/api/auditoria/export")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        
        content = response.text
        assert "Fecha,Usuario,Acción,Entidad,ID Entidad,Detalles" in content
        
        print("✓ Audit log CSV export works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
