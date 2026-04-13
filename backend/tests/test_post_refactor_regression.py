"""
DonatariaSAT Post-Refactor Regression Tests
Tests all endpoints after the monolithic server.py was split into modular routers.
Covers: Auth, Donantes, Donativos, CFDIs, Obligaciones, Transparencia, Alertas, 
        Workflows, Reportes, Cumplimiento, Exports, Catalogo, Auditoria, Config
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@donataria.org"
TEST_PASSWORD = "Test1234!"


class TestAuthAndOrganization:
    """Auth routes: /api/auth/* and /api/organizacion*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_login_success(self):
        """POST /api/auth/login - Valid credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user_id" in data
        assert data["email"] == TEST_EMAIL
        assert "organizacion_id" in data
        assert "organizaciones_ids" in data
        print(f"✓ Login successful, user has {len(data['organizaciones_ids'])} organizations")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login - Invalid credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_get_me(self):
        """GET /api/auth/me - Get current user"""
        # Login first
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        token = login_resp.json()["token"]
        
        response = self.session.get(f"{BASE_URL}/api/auth/me", 
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print(f"✓ GET /api/auth/me returned user: {data['name']}")
    
    def test_get_organizaciones(self):
        """GET /api/organizaciones - List user's organizations"""
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        token = login_resp.json()["token"]
        
        response = self.session.get(f"{BASE_URL}/api/organizaciones",
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ User has {len(data)} organizations")
    
    def test_get_organizacion(self):
        """GET /api/organizacion - Get current organization"""
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        token = login_resp.json()["token"]
        
        response = self.session.get(f"{BASE_URL}/api/organizacion",
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert "organizacion_id" in data
        assert "nombre" in data
        print(f"✓ Current org: {data['nombre']}")
    
    def test_switch_organizacion(self):
        """PUT /api/organizaciones/switch/{org_id} - Switch organization"""
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        data = login_resp.json()
        token = data["token"]
        org_ids = data["organizaciones_ids"]
        
        if len(org_ids) > 1:
            # Switch to second org
            response = self.session.put(f"{BASE_URL}/api/organizaciones/switch/{org_ids[1]}",
                headers={"Authorization": f"Bearer {token}"})
            assert response.status_code == 200
            print(f"✓ Switched to org: {response.json().get('nombre')}")
            
            # Switch back
            self.session.put(f"{BASE_URL}/api/organizaciones/switch/{org_ids[0]}",
                headers={"Authorization": f"Bearer {token}"})
        else:
            print("⚠ Only one org, skipping switch test")


class TestDonantes:
    """Donantes CRUD: /api/donantes/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_donantes(self):
        """GET /api/donantes - List donors"""
        response = self.session.get(f"{BASE_URL}/api/donantes", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} donantes")
    
    def test_create_donante(self):
        """POST /api/donantes - Create donor"""
        response = self.session.post(f"{BASE_URL}/api/donantes", headers=self.headers, json={
            "nombre": "TEST_Donante Prueba",
            "rfc": "ABC123456789",  # 12 chars for moral
            "tipo_persona": "moral",
            "email": "test@prueba.com"
        })
        assert response.status_code == 200, f"Create donante failed: {response.text}"
        data = response.json()
        assert "donante_id" in data
        assert data["nombre"] == "TEST_Donante Prueba"
        self.donante_id = data["donante_id"]
        print(f"✓ Created donante: {data['donante_id']}")
        return data["donante_id"]
    
    def test_get_donante_detail(self):
        """GET /api/donantes/{id} - Get donor detail"""
        # First create a donante
        create_resp = self.session.post(f"{BASE_URL}/api/donantes", headers=self.headers, json={
            "nombre": "TEST_Donante Detail",
            "rfc": "XAXX01010100",  # 12 chars for moral
            "tipo_persona": "moral"
        })
        donante_id = create_resp.json()["donante_id"]
        
        response = self.session.get(f"{BASE_URL}/api/donantes/{donante_id}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["donante_id"] == donante_id
        assert "historial_donativos" in data
        print(f"✓ Got donante detail with historial")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/donantes/{donante_id}", headers=self.headers)
    
    def test_update_donante(self):
        """PUT /api/donantes/{id} - Update donor"""
        # Create
        create_resp = self.session.post(f"{BASE_URL}/api/donantes", headers=self.headers, json={
            "nombre": "TEST_Donante Update",
            "rfc": "ABC123456789",  # 12 chars for moral
            "tipo_persona": "moral"
        })
        assert create_resp.status_code == 200, f"Create failed: {create_resp.text}"
        donante_id = create_resp.json()["donante_id"]
        
        # Update
        response = self.session.put(f"{BASE_URL}/api/donantes/{donante_id}", headers=self.headers, json={
            "nombre": "TEST_Donante Updated",
            "rfc": "ABC123456789",  # 12 chars for moral
            "tipo_persona": "moral",
            "email": "updated@test.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "TEST_Donante Updated"
        print(f"✓ Updated donante")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/donantes/{donante_id}", headers=self.headers)
    
    def test_delete_donante(self):
        """DELETE /api/donantes/{id} - Delete donor"""
        # Create
        create_resp = self.session.post(f"{BASE_URL}/api/donantes", headers=self.headers, json={
            "nombre": "TEST_Donante Delete",
            "rfc": "DEL123456789",  # 12 chars for moral
            "tipo_persona": "moral"
        })
        assert create_resp.status_code == 200, f"Create failed: {create_resp.text}"
        donante_id = create_resp.json()["donante_id"]
        
        # Delete
        response = self.session.delete(f"{BASE_URL}/api/donantes/{donante_id}", headers=self.headers)
        assert response.status_code == 200
        
        # Verify deleted
        get_resp = self.session.get(f"{BASE_URL}/api/donantes/{donante_id}", headers=self.headers)
        assert get_resp.status_code == 404
        print(f"✓ Deleted donante and verified 404")


class TestDonativos:
    """Donativos CRUD: /api/donativos/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_donativos(self):
        """GET /api/donativos - List donations"""
        response = self.session.get(f"{BASE_URL}/api/donativos", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} donativos")
    
    def test_create_donativo(self):
        """POST /api/donativos - Create donation with valid donante"""
        # First create a donante
        donante_resp = self.session.post(f"{BASE_URL}/api/donantes", headers=self.headers, json={
            "nombre": "TEST_Donante for Donativo",
            "rfc": "DON123456789",  # 12 chars for moral
            "tipo_persona": "moral"
        })
        assert donante_resp.status_code == 200, f"Create donante failed: {donante_resp.text}"
        donante_id = donante_resp.json()["donante_id"]
        
        # Create donativo
        response = self.session.post(f"{BASE_URL}/api/donativos", headers=self.headers, json={
            "donante_id": donante_id,
            "monto": 5000.00,
            "moneda": "MXN",
            "tipo_donativo": "efectivo",
            "fecha_donativo": datetime.now().isoformat()
        })
        assert response.status_code == 200
        data = response.json()
        assert "donativo_id" in data
        assert data["monto"] == 5000.00
        print(f"✓ Created donativo: {data['donativo_id']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/donativos/{data['donativo_id']}", headers=self.headers)
        self.session.delete(f"{BASE_URL}/api/donantes/{donante_id}", headers=self.headers)
    
    def test_create_donativo_invalid_donante(self):
        """POST /api/donativos - Should fail with invalid donante_id"""
        response = self.session.post(f"{BASE_URL}/api/donativos", headers=self.headers, json={
            "donante_id": "invalid_donante_id",
            "monto": 1000.00,
            "moneda": "MXN",
            "tipo_donativo": "efectivo"
        })
        assert response.status_code == 404
        print(f"✓ Invalid donante correctly rejected")


class TestCFDIs:
    """CFDIs CRUD + timbrar + cancelar: /api/cfdis/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_cfdis(self):
        """GET /api/cfdis - List CFDIs"""
        response = self.session.get(f"{BASE_URL}/api/cfdis", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} CFDIs")
    
    def test_create_cfdi_and_timbrar(self):
        """POST /api/cfdis + POST /api/cfdis/{id}/timbrar - Create and stamp CFDI"""
        # Create donante
        donante_resp = self.session.post(f"{BASE_URL}/api/donantes", headers=self.headers, json={
            "nombre": "TEST_Donante for CFDI",
            "rfc": "CFD123456789",  # 12 chars for moral
            "tipo_persona": "moral"
        })
        assert donante_resp.status_code == 200, f"Create donante failed: {donante_resp.text}"
        donante_id = donante_resp.json()["donante_id"]
        
        # Create donativo
        donativo_resp = self.session.post(f"{BASE_URL}/api/donativos", headers=self.headers, json={
            "donante_id": donante_id,
            "monto": 10000.00,
            "moneda": "MXN",
            "tipo_donativo": "efectivo",
            "fecha_donativo": datetime.now().isoformat()
        })
        donativo_id = donativo_resp.json()["donativo_id"]
        
        # Create CFDI
        cfdi_resp = self.session.post(f"{BASE_URL}/api/cfdis", headers=self.headers, json={
            "donativo_id": donativo_id,
            "donante_id": donante_id,
            "monto": 10000.00,
            "concepto": "Donativo de prueba"
        })
        assert cfdi_resp.status_code == 200
        cfdi_data = cfdi_resp.json()
        assert "cfdi_id" in cfdi_data
        assert cfdi_data["estado"] == "borrador"
        cfdi_id = cfdi_data["cfdi_id"]
        print(f"✓ Created CFDI: {cfdi_id}")
        
        # Timbrar (MOCKED)
        timbrar_resp = self.session.post(f"{BASE_URL}/api/cfdis/{cfdi_id}/timbrar", headers=self.headers)
        assert timbrar_resp.status_code == 200
        timbrar_data = timbrar_resp.json()
        assert "uuid_fiscal" in timbrar_data
        print(f"✓ Timbrado CFDI (MOCKED): UUID={timbrar_data['uuid_fiscal'][:8]}...")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/donativos/{donativo_id}", headers=self.headers)
        self.session.delete(f"{BASE_URL}/api/donantes/{donante_id}", headers=self.headers)
    
    def test_cancelar_cfdi(self):
        """POST /api/cfdis/{id}/cancelar - Cancel CFDI"""
        # Create donante, donativo, cfdi
        donante_resp = self.session.post(f"{BASE_URL}/api/donantes", headers=self.headers, json={
            "nombre": "TEST_Donante for Cancel",
            "rfc": "CAN123456789",  # 12 chars for moral
            "tipo_persona": "moral"
        })
        assert donante_resp.status_code == 200, f"Create donante failed: {donante_resp.text}"
        donante_id = donante_resp.json()["donante_id"]
        
        donativo_resp = self.session.post(f"{BASE_URL}/api/donativos", headers=self.headers, json={
            "donante_id": donante_id,
            "monto": 5000.00,
            "moneda": "MXN",
            "tipo_donativo": "efectivo",
            "fecha_donativo": datetime.now().isoformat()
        })
        donativo_id = donativo_resp.json()["donativo_id"]
        
        cfdi_resp = self.session.post(f"{BASE_URL}/api/cfdis", headers=self.headers, json={
            "donativo_id": donativo_id,
            "donante_id": donante_id,
            "monto": 5000.00
        })
        cfdi_id = cfdi_resp.json()["cfdi_id"]
        
        # Cancel
        cancel_resp = self.session.post(f"{BASE_URL}/api/cfdis/{cfdi_id}/cancelar", headers=self.headers)
        assert cancel_resp.status_code == 200
        print(f"✓ Cancelled CFDI")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/donativos/{donativo_id}", headers=self.headers)
        self.session.delete(f"{BASE_URL}/api/donantes/{donante_id}", headers=self.headers)


class TestObligacionesFiscales:
    """Obligaciones Fiscales: /api/obligaciones/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_obligaciones(self):
        """GET /api/obligaciones - List fiscal obligations"""
        response = self.session.get(f"{BASE_URL}/api/obligaciones", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} obligaciones")
    
    def test_create_obligacion(self):
        """POST /api/obligaciones - Create obligation"""
        fecha_limite = (datetime.now() + timedelta(days=30)).isoformat()
        response = self.session.post(f"{BASE_URL}/api/obligaciones", headers=self.headers, json={
            "nombre": "TEST_Obligacion Prueba",
            "descripcion": "Obligación de prueba",
            "tipo": "declaracion",
            "frecuencia": "mensual",
            "fecha_limite": fecha_limite
        })
        assert response.status_code == 200
        data = response.json()
        assert "obligacion_id" in data
        print(f"✓ Created obligacion: {data['obligacion_id']}")
        return data["obligacion_id"]
    
    def test_update_obligacion_estado(self):
        """PUT /api/obligaciones/{id}/estado - Update obligation status"""
        # Create
        fecha_limite = (datetime.now() + timedelta(days=30)).isoformat()
        create_resp = self.session.post(f"{BASE_URL}/api/obligaciones", headers=self.headers, json={
            "nombre": "TEST_Obligacion Estado",
            "tipo": "declaracion",
            "frecuencia": "mensual",
            "fecha_limite": fecha_limite
        })
        obl_id = create_resp.json()["obligacion_id"]
        
        # Update estado
        response = self.session.put(f"{BASE_URL}/api/obligaciones/{obl_id}/estado?estado=cumplida", 
            headers=self.headers)
        assert response.status_code == 200
        print(f"✓ Updated obligacion estado to cumplida")


class TestTransparencia:
    """Informes de Transparencia: /api/transparencia/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_informes(self):
        """GET /api/transparencia - List transparency reports"""
        response = self.session.get(f"{BASE_URL}/api/transparencia", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} informes de transparencia")
    
    def test_create_informe(self):
        """POST /api/transparencia - Create transparency report"""
        # Use a future year to avoid conflicts
        response = self.session.post(f"{BASE_URL}/api/transparencia", headers=self.headers, json={
            "ejercicio_fiscal": 2099
        })
        # May return 400 if already exists
        if response.status_code == 200:
            data = response.json()
            assert "informe_id" in data
            print(f"✓ Created informe: {data['informe_id']}")
        else:
            print(f"⚠ Informe for 2099 may already exist")


class TestAlertas:
    """AML Alerts and Rules: /api/alertas/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_alertas(self):
        """GET /api/alertas - List alerts"""
        response = self.session.get(f"{BASE_URL}/api/alertas", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} alertas")
    
    def test_list_reglas(self):
        """GET /api/alertas/reglas - List alert rules"""
        response = self.session.get(f"{BASE_URL}/api/alertas/reglas", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} reglas de alerta")
    
    def test_create_regla(self):
        """POST /api/alertas/reglas - Create alert rule"""
        response = self.session.post(f"{BASE_URL}/api/alertas/reglas", headers=self.headers, json={
            "nombre": "TEST_Regla Prueba",
            "tipo_regla": "umbral_monto",
            "severidad": "alta",
            "condiciones": {"monto_minimo": 50000},
            "activa": True
        })
        assert response.status_code == 200
        data = response.json()
        assert "rule_id" in data
        print(f"✓ Created regla: {data['rule_id']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/alertas/reglas/{data['rule_id']}", headers=self.headers)
    
    def test_create_manual_alert(self):
        """POST /api/alertas - Create manual alert"""
        response = self.session.post(f"{BASE_URL}/api/alertas", headers=self.headers, json={
            "tipo": "manual",
            "severidad": "media",
            "titulo": "TEST_Alerta Manual",
            "descripcion": "Alerta creada manualmente para pruebas"
        })
        assert response.status_code == 200
        data = response.json()
        assert "alert_id" in data
        print(f"✓ Created manual alert: {data['alert_id']}")
    
    def test_alertas_stats(self):
        """GET /api/alertas/stats - Get alert statistics"""
        response = self.session.get(f"{BASE_URL}/api/alertas/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "nuevas" in data
        print(f"✓ Alert stats: total={data['total']}, nuevas={data['nuevas']}")


class TestWorkflows:
    """Workflows CRUD: /api/workflows/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_workflows(self):
        """GET /api/workflows - List workflows"""
        response = self.session.get(f"{BASE_URL}/api/workflows", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} workflows")
    
    def test_create_workflow(self):
        """POST /api/workflows - Create workflow"""
        response = self.session.post(f"{BASE_URL}/api/workflows", headers=self.headers, json={
            "nombre": "TEST_Workflow Prueba",
            "descripcion": "Workflow de prueba",
            "trigger_type": "donativo_creado",
            "condiciones": {},
            "acciones": [{"tipo": "crear_alerta", "severidad": "baja", "titulo": "Test"}],
            "activo": True
        })
        assert response.status_code == 200
        data = response.json()
        assert "workflow_id" in data
        print(f"✓ Created workflow: {data['workflow_id']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/workflows/{data['workflow_id']}", headers=self.headers)
    
    def test_toggle_workflow(self):
        """PUT /api/workflows/{id}/toggle - Toggle workflow active state"""
        # Create
        create_resp = self.session.post(f"{BASE_URL}/api/workflows", headers=self.headers, json={
            "nombre": "TEST_Workflow Toggle",
            "trigger_type": "alerta_creada",
            "activo": True
        })
        wf_id = create_resp.json()["workflow_id"]
        
        # Toggle
        response = self.session.put(f"{BASE_URL}/api/workflows/{wf_id}/toggle", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "activo" in data
        print(f"✓ Toggled workflow, activo={data['activo']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/workflows/{wf_id}", headers=self.headers)


class TestReportes:
    """Reports: /api/reportes/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_reportes(self):
        """GET /api/reportes - List reports"""
        response = self.session.get(f"{BASE_URL}/api/reportes", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} reportes")
    
    def test_create_reporte(self):
        """POST /api/reportes - Create report"""
        response = self.session.post(f"{BASE_URL}/api/reportes", headers=self.headers, json={
            "titulo": "TEST_Reporte Prueba",
            "tipo": "reporte_mensual",
            "destinatario": "UIF",
            "periodo_inicio": "2026-01-01",
            "periodo_fin": "2026-01-31"
        })
        assert response.status_code == 200
        data = response.json()
        assert "report_id" in data
        print(f"✓ Created reporte: {data['report_id']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/reportes/{data['report_id']}", headers=self.headers)


class TestDashboardAndCumplimiento:
    """Dashboard stats and Compliance metrics"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_dashboard_stats(self):
        """GET /api/dashboard/stats - Get dashboard statistics"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_donantes" in data
        assert "total_donativos" in data
        assert "total_cfdis" in data
        assert "donativos_por_mes" in data
        print(f"✓ Dashboard: {data['total_donantes']} donantes, ${data['total_donativos']:,.2f} donativos")
    
    def test_cumplimiento_metrics(self):
        """GET /api/cumplimiento - Get compliance metrics"""
        response = self.session.get(f"{BASE_URL}/api/cumplimiento", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "nivel" in data
        assert "resumen" in data
        print(f"✓ Cumplimiento: score={data['score']}%, nivel={data['nivel']}")


class TestCatalogoSAT:
    """Catálogo de Donatarias Autorizadas: /api/catalogo/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_catalogo(self):
        """GET /api/catalogo/donatarias - List catalog (public)"""
        response = self.session.get(f"{BASE_URL}/api/catalogo/donatarias")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "items" in data
        print(f"✓ Catálogo: {data['total']} donatarias")
    
    def test_catalogo_with_filters(self):
        """GET /api/catalogo/donatarias with filters"""
        response = self.session.get(f"{BASE_URL}/api/catalogo/donatarias?giro=asistencial&limit=10")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Filtered catálogo: {len(data['items'])} items with giro=asistencial")
    
    def test_catalogo_giros(self):
        """GET /api/catalogo/donatarias/giros - Get filter options"""
        response = self.session.get(f"{BASE_URL}/api/catalogo/donatarias/giros")
        assert response.status_code == 200
        data = response.json()
        assert "giros" in data
        assert "estados" in data
        print(f"✓ Catálogo giros: {len(data['giros'])} giros, {len(data['estados'])} estados")


class TestExports:
    """CSV Exports: /api/exportar/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_export_donantes(self):
        """GET /api/exportar/donantes - Export donors CSV"""
        response = self.session.get(f"{BASE_URL}/api/exportar/donantes", headers=self.headers)
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print(f"✓ Exported donantes CSV ({len(response.content)} bytes)")
    
    def test_export_donativos(self):
        """GET /api/exportar/donativos - Export donations CSV"""
        response = self.session.get(f"{BASE_URL}/api/exportar/donativos", headers=self.headers)
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print(f"✓ Exported donativos CSV ({len(response.content)} bytes)")
    
    def test_export_alertas(self):
        """GET /api/exportar/alertas - Export alerts CSV"""
        response = self.session.get(f"{BASE_URL}/api/exportar/alertas", headers=self.headers)
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print(f"✓ Exported alertas CSV ({len(response.content)} bytes)")


class TestAuditoria:
    """Audit Log: /api/auditoria/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_audit_log(self):
        """GET /api/auditoria - List audit logs"""
        response = self.session.get(f"{BASE_URL}/api/auditoria", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "logs" in data
        print(f"✓ Audit log: {data['total']} entries")
    
    def test_audit_log_pagination(self):
        """GET /api/auditoria with pagination"""
        response = self.session.get(f"{BASE_URL}/api/auditoria?limit=10&skip=0", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["logs"]) <= 10
        print(f"✓ Audit log pagination works")


class TestNotificationsConfig:
    """Notifications and Cron: /api/notifications/*, /api/cron/*"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_notification_status(self):
        """GET /api/notifications/status - Check notification config"""
        response = self.session.get(f"{BASE_URL}/api/notifications/status", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "email_configured" in data
        print(f"✓ Notification status: email_configured={data['email_configured']}")
    
    def test_cron_status(self):
        """GET /api/cron/status - Check scheduler status"""
        response = self.session.get(f"{BASE_URL}/api/cron/status", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "scheduler_active" in data
        print(f"✓ Cron status: scheduler_active={data['scheduler_active']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
