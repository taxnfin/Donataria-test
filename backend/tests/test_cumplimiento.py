"""
DonatariaSAT Compliance Metrics Tests (Iteration 4)
Tests for: GET /api/cumplimiento, GET /api/cumplimiento/pdf
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@donataria.org"
TEST_PASSWORD = "Test1234!"
TEST_NAME = "Test User"


class TestCumplimientoEndpoints:
    """Compliance Metrics API tests"""
    
    def test_get_cumplimiento_metrics(self, authenticated_session):
        """Test GET /api/cumplimiento returns compliance metrics"""
        response = authenticated_session.get(f"{BASE_URL}/api/cumplimiento")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "score" in data, "Missing 'score' field"
        assert "nivel" in data, "Missing 'nivel' field"
        assert "resumen" in data, "Missing 'resumen' field"
        assert "chart_mensual" in data, "Missing 'chart_mensual' field"
        assert "desglose_tipo" in data, "Missing 'desglose_tipo' field"
        assert "tendencia" in data, "Missing 'tendencia' field"
        assert "proximas_vencer" in data, "Missing 'proximas_vencer' field"
        
        # Verify score is a number between 0-100
        assert isinstance(data["score"], (int, float)), "Score should be numeric"
        assert 0 <= data["score"] <= 100, f"Score {data['score']} out of range 0-100"
        
        # Verify nivel is one of expected values
        valid_niveles = ["excelente", "bueno", "regular", "critico"]
        assert data["nivel"] in valid_niveles, f"Invalid nivel: {data['nivel']}"
        
        # Verify resumen structure
        resumen = data["resumen"]
        assert "total" in resumen, "Missing 'total' in resumen"
        assert "cumplidas" in resumen, "Missing 'cumplidas' in resumen"
        assert "pendientes" in resumen, "Missing 'pendientes' in resumen"
        assert "vencidas" in resumen, "Missing 'vencidas' in resumen"
        assert "omitidas" in resumen, "Missing 'omitidas' in resumen"
        
        # Verify chart_mensual is a list with 12 months
        assert isinstance(data["chart_mensual"], list), "chart_mensual should be a list"
        assert len(data["chart_mensual"]) == 12, f"chart_mensual should have 12 months, got {len(data['chart_mensual'])}"
        
        # Verify each month has required fields
        for month in data["chart_mensual"]:
            assert "mes" in month, "Missing 'mes' in chart_mensual item"
            assert "total" in month, "Missing 'total' in chart_mensual item"
            assert "cumplidas" in month, "Missing 'cumplidas' in chart_mensual item"
            assert "porcentaje" in month, "Missing 'porcentaje' in chart_mensual item"
        
        # Verify desglose_tipo is a list
        assert isinstance(data["desglose_tipo"], list), "desglose_tipo should be a list"
        
        # Verify tendencia is a list
        assert isinstance(data["tendencia"], list), "tendencia should be a list"
        
        # Verify proximas_vencer is a list
        assert isinstance(data["proximas_vencer"], list), "proximas_vencer should be a list"
        
        print(f"✓ GET /api/cumplimiento working")
        print(f"  Score: {data['score']}%, Nivel: {data['nivel']}")
        print(f"  Resumen: Total={resumen['total']}, Cumplidas={resumen['cumplidas']}, Pendientes={resumen['pendientes']}, Vencidas={resumen['vencidas']}")
        return data
    
    def test_cumplimiento_score_calculation(self, authenticated_session):
        """Test that compliance score is calculated correctly"""
        response = authenticated_session.get(f"{BASE_URL}/api/cumplimiento")
        assert response.status_code == 200
        data = response.json()
        
        resumen = data["resumen"]
        
        # Score should be based on cumplidas vs (cumplidas + vencidas + omitidas)
        past_obligations = resumen["cumplidas"] + resumen["vencidas"] + resumen["omitidas"]
        
        if past_obligations > 0:
            expected_score = round((resumen["cumplidas"] / past_obligations) * 100, 1)
            # Allow small floating point differences
            assert abs(data["score"] - expected_score) < 0.5, f"Score mismatch: got {data['score']}, expected ~{expected_score}"
        else:
            # If no past obligations, score should be 100
            assert data["score"] == 100.0, f"Score should be 100 when no past obligations, got {data['score']}"
        
        print(f"✓ Score calculation verified: {data['score']}%")
    
    def test_cumplimiento_nivel_mapping(self, authenticated_session):
        """Test that nivel is correctly mapped from score"""
        response = authenticated_session.get(f"{BASE_URL}/api/cumplimiento")
        assert response.status_code == 200
        data = response.json()
        
        score = data["score"]
        nivel = data["nivel"]
        
        # Verify nivel matches score range
        if score >= 80:
            assert nivel == "excelente", f"Score {score} should be 'excelente', got '{nivel}'"
        elif score >= 60:
            assert nivel == "bueno", f"Score {score} should be 'bueno', got '{nivel}'"
        elif score >= 40:
            assert nivel == "regular", f"Score {score} should be 'regular', got '{nivel}'"
        else:
            assert nivel == "critico", f"Score {score} should be 'critico', got '{nivel}'"
        
        print(f"✓ Nivel mapping verified: {score}% -> {nivel}")
    
    def test_get_cumplimiento_pdf(self, authenticated_session):
        """Test GET /api/cumplimiento/pdf returns a valid PDF"""
        response = authenticated_session.get(f"{BASE_URL}/api/cumplimiento/pdf")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify content type is PDF
        content_type = response.headers.get("content-type", "")
        assert "application/pdf" in content_type, f"Expected PDF content-type, got: {content_type}"
        
        # Verify content-disposition header for download
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition, f"Expected attachment disposition, got: {content_disposition}"
        assert ".pdf" in content_disposition, f"Expected .pdf in filename, got: {content_disposition}"
        
        # Verify PDF content starts with PDF magic bytes
        content = response.content
        assert len(content) > 0, "PDF content is empty"
        assert content[:4] == b'%PDF', f"Content doesn't start with PDF magic bytes: {content[:10]}"
        
        print(f"✓ GET /api/cumplimiento/pdf working")
        print(f"  Content-Type: {content_type}")
        print(f"  Content-Disposition: {content_disposition}")
        print(f"  PDF Size: {len(content)} bytes")
    
    def test_cumplimiento_unauthorized(self):
        """Test that cumplimiento endpoints require authentication"""
        session = requests.Session()
        
        # Test metrics endpoint
        response = session.get(f"{BASE_URL}/api/cumplimiento")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # Test PDF endpoint
        response = session.get(f"{BASE_URL}/api/cumplimiento/pdf")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        print("✓ Cumplimiento endpoints require authentication")


# ==================== FIXTURES ====================

@pytest.fixture(scope="module")
def session():
    """Create a requests session"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s

@pytest.fixture(scope="module")
def authenticated_session(session):
    """Create an authenticated session"""
    # Try to login
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if response.status_code == 401:
        # Register first
        reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME,
            "organizacion_nombre": "Test Organization"
        })
        if reg_response.status_code != 200:
            pytest.skip(f"Could not create test user: {reg_response.text}")
        
        # Login again
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
    
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.text}")
    
    # Get token from response
    data = response.json()
    if "token" in data:
        session.headers.update({"Authorization": f"Bearer {data['token']}"})
    
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
