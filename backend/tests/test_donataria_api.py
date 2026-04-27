"""
DonatariaSAT API Tests
Tests for: Auth, Donantes, Donativos, CFDIs, Alertas, Reportes, Workflows
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

# BASE_URL imported from conftest

# Test credentials
from conftest import TEST_EMAIL, TEST_PASSWORD, BASE_URL
TEST_NAME = "Test User"

class TestHealthAndAuth:
    """Health check and authentication tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("✓ Health endpoint working")
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "DonatariaSAT" in data.get("message", "")
        print("✓ Root endpoint working")
    
    def test_login_with_test_credentials(self, session):
        """Test login with test credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response.status_code == 401:
            # User doesn't exist, create it first
            reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME,
                "organizacion_nombre": "Test Organization"
            })
            assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
            print("✓ Test user created")
            
            # Now login
            response = session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert data["email"] == TEST_EMAIL
        print(f"✓ Login successful for {TEST_EMAIL}")
        return data
    
    def test_get_current_user(self, authenticated_session):
        """Test getting current user info"""
        response = authenticated_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print("✓ Get current user working")


class TestDonantes:
    """Donantes CRUD tests"""
    
    def test_get_donantes_list(self, authenticated_session):
        """Test getting list of donantes"""
        response = authenticated_session.get(f"{BASE_URL}/api/donantes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get donantes list working ({len(data)} donantes)")
    
    def test_create_donante(self, authenticated_session):
        """Test creating a new donante"""
        donante_data = {
            "nombre": "TEST_Donante Prueba",
            "tipo_persona": "fisica",
            "rfc": "XAXX010101000",
            "es_extranjero": False,
            "email": "test_donante@example.com",
            "telefono": "5512345678",
            "direccion": "Calle Test 123",
            "pais": "México"
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/donantes", json=donante_data)
        assert response.status_code == 200, f"Create donante failed: {response.text}"
        data = response.json()
        assert "donante_id" in data
        assert data["nombre"] == donante_data["nombre"]
        print(f"✓ Create donante working (ID: {data['donante_id']})")
        return data
    
    def test_get_donante_by_id(self, authenticated_session, test_donante):
        """Test getting a specific donante"""
        donante_id = test_donante["donante_id"]
        response = authenticated_session.get(f"{BASE_URL}/api/donantes/{donante_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["donante_id"] == donante_id
        print(f"✓ Get donante by ID working")
    
    def test_update_donante(self, authenticated_session, test_donante):
        """Test updating a donante"""
        donante_id = test_donante["donante_id"]
        update_data = {
            "nombre": "TEST_Donante Actualizado",
            "tipo_persona": "fisica",
            "rfc": "XAXX010101000",
            "es_extranjero": False,
            "email": "updated@example.com",
            "telefono": "5587654321",
            "direccion": "Calle Actualizada 456",
            "pais": "México"
        }
        
        response = authenticated_session.put(f"{BASE_URL}/api/donantes/{donante_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == update_data["nombre"]
        print("✓ Update donante working")


class TestAlertas:
    """AML Alerts tests"""
    
    def test_get_alertas_list(self, authenticated_session):
        """Test getting list of alertas"""
        response = authenticated_session.get(f"{BASE_URL}/api/alertas")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get alertas list working ({len(data)} alertas)")
    
    def test_get_alertas_stats(self, authenticated_session):
        """Test getting alertas statistics"""
        response = authenticated_session.get(f"{BASE_URL}/api/alertas/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "nuevas" in data
        assert "criticas" in data
        assert "altas" in data
        print(f"✓ Get alertas stats working (Total: {data['total']}, Nuevas: {data['nuevas']})")
    
    def test_get_alert_rules(self, authenticated_session):
        """Test getting alert rules"""
        response = authenticated_session.get(f"{BASE_URL}/api/alertas/reglas")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get alert rules working ({len(data)} rules)")
    
    def test_create_alert_rule(self, authenticated_session):
        """Test creating an alert rule"""
        rule_data = {
            "nombre": "TEST_Umbral Alto",
            "descripcion": "Alerta para montos mayores a 100,000",
            "tipo_regla": "umbral_monto",
            "severidad": "alta",
            "condiciones": {"monto_minimo": 100000},
            "activa": True
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/alertas/reglas", json=rule_data)
        assert response.status_code == 200, f"Create rule failed: {response.text}"
        data = response.json()
        assert "rule_id" in data
        assert data["nombre"] == rule_data["nombre"]
        print(f"✓ Create alert rule working (ID: {data['rule_id']})")
        return data
    
    def test_toggle_alert_rule(self, authenticated_session, test_alert_rule):
        """Test toggling alert rule active state"""
        rule_id = test_alert_rule["rule_id"]
        response = authenticated_session.put(f"{BASE_URL}/api/alertas/reglas/{rule_id}/toggle")
        assert response.status_code == 200
        data = response.json()
        assert "activa" in data
        print(f"✓ Toggle alert rule working (activa: {data['activa']})")
    
    def test_create_manual_alert(self, authenticated_session):
        """Test creating a manual alert"""
        alert_data = {
            "tipo": "manual",
            "severidad": "media",
            "titulo": "TEST_Alerta Manual",
            "descripcion": "Esta es una alerta de prueba",
            "tags": ["test", "manual"]
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/alertas", json=alert_data)
        assert response.status_code == 200, f"Create alert failed: {response.text}"
        data = response.json()
        assert "alert_id" in data
        print(f"✓ Create manual alert working (ID: {data['alert_id']})")
        return data


class TestReportes:
    """Reports module tests"""
    
    def test_get_reportes_list(self, authenticated_session):
        """Test getting list of reports"""
        response = authenticated_session.get(f"{BASE_URL}/api/reportes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get reportes list working ({len(data)} reportes)")
    
    def test_get_plantillas_list(self, authenticated_session):
        """Test getting list of report templates"""
        response = authenticated_session.get(f"{BASE_URL}/api/reportes/plantillas")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get plantillas list working ({len(data)} plantillas)")
    
    def test_create_plantilla(self, authenticated_session):
        """Test creating a report template"""
        plantilla_data = {
            "nombre": "TEST_Plantilla STR",
            "tipo_reporte": "str_sar",
            "descripcion": "Plantilla de prueba para STR",
            "criterios": {"severidades": ["alta", "critica"]},
            "formato": "PDF",
            "destinatario": "UIF",
            "periodicidad": "mensual"
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/reportes/plantillas", json=plantilla_data)
        assert response.status_code == 200, f"Create plantilla failed: {response.text}"
        data = response.json()
        assert "template_id" in data
        assert data["nombre"] == plantilla_data["nombre"]
        print(f"✓ Create plantilla working (ID: {data['template_id']})")
        return data
    
    def test_create_reporte(self, authenticated_session):
        """Test creating a report"""
        now = datetime.now()
        reporte_data = {
            "titulo": "TEST_Reporte STR Marzo",
            "tipo": "str_sar",
            "descripcion": "Reporte de prueba",
            "destinatario": "UIF",
            "periodo_inicio": (now - timedelta(days=30)).isoformat(),
            "periodo_fin": now.isoformat()
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/reportes", json=reporte_data)
        assert response.status_code == 200, f"Create reporte failed: {response.text}"
        data = response.json()
        assert "report_id" in data
        assert data["titulo"] == reporte_data["titulo"]
        assert "datos" in data  # Should have generated data
        print(f"✓ Create reporte working (ID: {data['report_id']})")
        return data
    
    def test_update_reporte_estado(self, authenticated_session, test_reporte):
        """Test updating report status"""
        report_id = test_reporte["report_id"]
        response = authenticated_session.put(f"{BASE_URL}/api/reportes/{report_id}/estado?estado=enviado")
        assert response.status_code == 200
        print("✓ Update reporte estado working")


class TestWorkflows:
    """Workflows module tests"""
    
    def test_get_workflows_list(self, authenticated_session):
        """Test getting list of workflows"""
        response = authenticated_session.get(f"{BASE_URL}/api/workflows")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get workflows list working ({len(data)} workflows)")
    
    def test_create_workflow(self, authenticated_session):
        """Test creating a workflow"""
        workflow_data = {
            "nombre": "TEST_Notificar Alertas Críticas",
            "descripcion": "Envía email cuando se crea una alerta crítica",
            "trigger": "alerta_creada",
            "condiciones": [
                {"campo": "severidad", "operador": "equals", "valor": "critica"}
            ],
            "acciones": [
                {
                    "tipo": "email",
                    "destinatario": "admin@test.com",
                    "asunto": "Alerta Crítica",
                    "mensaje": "Se ha detectado una alerta crítica"
                }
            ],
            "activo": True
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/workflows", json=workflow_data)
        assert response.status_code == 200, f"Create workflow failed: {response.text}"
        data = response.json()
        assert "workflow_id" in data
        assert data["nombre"] == workflow_data["nombre"]
        assert data["ejecuciones"] == 0
        print(f"✓ Create workflow working (ID: {data['workflow_id']})")
        return data
    
    def test_toggle_workflow(self, authenticated_session, test_workflow):
        """Test toggling workflow active state"""
        workflow_id = test_workflow["workflow_id"]
        response = authenticated_session.put(f"{BASE_URL}/api/workflows/{workflow_id}/toggle")
        assert response.status_code == 200
        data = response.json()
        assert "activo" in data
        print(f"✓ Toggle workflow working (activo: {data['activo']})")
    
    def test_update_workflow(self, authenticated_session, test_workflow):
        """Test updating a workflow"""
        workflow_id = test_workflow["workflow_id"]
        update_data = {
            "nombre": "TEST_Workflow Actualizado",
            "descripcion": "Descripción actualizada",
            "trigger": "alerta_creada",
            "condiciones": [],
            "acciones": [],
            "activo": False
        }
        
        response = authenticated_session.put(f"{BASE_URL}/api/workflows/{workflow_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == update_data["nombre"]
        print("✓ Update workflow working")


class TestExports:
    """CSV Export tests"""
    
    def test_export_donantes_csv(self, authenticated_session):
        """Test exporting donantes to CSV"""
        response = authenticated_session.get(f"{BASE_URL}/api/exportar/donantes")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print("✓ Export donantes CSV working")
    
    def test_export_alertas_csv(self, authenticated_session):
        """Test exporting alertas to CSV"""
        response = authenticated_session.get(f"{BASE_URL}/api/exportar/alertas")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print("✓ Export alertas CSV working")
    
    def test_export_donativos_csv(self, authenticated_session):
        """Test exporting donativos to CSV"""
        response = authenticated_session.get(f"{BASE_URL}/api/exportar/donativos")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print("✓ Export donativos CSV working")


class TestDashboard:
    """Dashboard stats tests"""
    
    def test_get_dashboard_stats(self, authenticated_session):
        """Test getting dashboard statistics"""
        response = authenticated_session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_donativos" in data
        assert "total_donantes" in data
        assert "total_cfdis" in data
        assert "donativos_por_mes" in data
        print(f"✓ Dashboard stats working (Donantes: {data['total_donantes']}, CFDIs: {data['total_cfdis']})")


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

@pytest.fixture
def test_donante(authenticated_session):
    """Create a test donante"""
    donante_data = {
        "nombre": f"TEST_Donante_{datetime.now().timestamp()}",
        "tipo_persona": "fisica",
        "rfc": "XAXX010101000",
        "es_extranjero": False,
        "email": "fixture_donante@example.com",
        "pais": "México"
    }
    response = authenticated_session.post(f"{BASE_URL}/api/donantes", json=donante_data)
    if response.status_code != 200:
        pytest.skip(f"Could not create test donante: {response.text}")
    return response.json()

@pytest.fixture
def test_alert_rule(authenticated_session):
    """Create a test alert rule"""
    rule_data = {
        "nombre": f"TEST_Rule_{datetime.now().timestamp()}",
        "descripcion": "Test rule",
        "tipo_regla": "umbral_monto",
        "severidad": "media",
        "condiciones": {"monto_minimo": 50000},
        "activa": True
    }
    response = authenticated_session.post(f"{BASE_URL}/api/alertas/reglas", json=rule_data)
    if response.status_code != 200:
        pytest.skip(f"Could not create test rule: {response.text}")
    return response.json()

@pytest.fixture
def test_reporte(authenticated_session):
    """Create a test report"""
    now = datetime.now()
    reporte_data = {
        "titulo": f"TEST_Reporte_{datetime.now().timestamp()}",
        "tipo": "str_sar",
        "descripcion": "Test report",
        "destinatario": "interno",
        "periodo_inicio": (now - timedelta(days=30)).isoformat(),
        "periodo_fin": now.isoformat()
    }
    response = authenticated_session.post(f"{BASE_URL}/api/reportes", json=reporte_data)
    if response.status_code != 200:
        pytest.skip(f"Could not create test report: {response.text}")
    return response.json()

@pytest.fixture
def test_workflow(authenticated_session):
    """Create a test workflow"""
    workflow_data = {
        "nombre": f"TEST_Workflow_{datetime.now().timestamp()}",
        "descripcion": "Test workflow",
        "trigger": "alerta_creada",
        "condiciones": [],
        "acciones": [],
        "activo": True
    }
    response = authenticated_session.post(f"{BASE_URL}/api/workflows", json=workflow_data)
    if response.status_code != 200:
        pytest.skip(f"Could not create test workflow: {response.text}")
    return response.json()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
