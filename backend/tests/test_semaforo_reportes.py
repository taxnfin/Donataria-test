from conftest import TEST_EMAIL, TEST_PASSWORD, BASE_URL
"""
Test suite for Iteration 11: Semaforo de Cumplimiento and Reportes Operativos
Tests the new dashboard endpoints:
- GET /api/dashboard/semaforo - Semaforo de cumplimiento with 4 indicators
- GET /api/dashboard/reportes-operativos - Full operational reports
- GET /api/dashboard/ficha-publica - Public transparency card
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSemaforoCumplimiento:
    """Tests for the Semaforo de Cumplimiento endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session for authenticated requests"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@donataria.org",
            "password": "Test1234!"
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_semaforo_endpoint_returns_200(self):
        """GET /api/dashboard/semaforo returns 200"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/semaforo")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Semaforo endpoint returns 200")
    
    def test_semaforo_has_required_fields(self):
        """Semaforo response has semaforo color and score_general"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/semaforo")
        assert response.status_code == 200
        data = response.json()
        
        # Check top-level fields
        assert "semaforo" in data, "Missing 'semaforo' field"
        assert "score_general" in data, "Missing 'score_general' field"
        assert "indicadores" in data, "Missing 'indicadores' field"
        
        # Validate semaforo color
        assert data["semaforo"] in ["verde", "ambar", "rojo"], f"Invalid semaforo color: {data['semaforo']}"
        
        # Validate score_general is a number between 0-100
        assert isinstance(data["score_general"], (int, float)), "score_general should be numeric"
        assert 0 <= data["score_general"] <= 100, f"score_general out of range: {data['score_general']}"
        
        print(f"✓ Semaforo: {data['semaforo']}, Score: {data['score_general']}%")
    
    def test_semaforo_has_four_indicators(self):
        """Semaforo has 4 indicators: cumplimiento, kyc, control_10, aml"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/semaforo")
        assert response.status_code == 200
        data = response.json()
        
        indicadores = data.get("indicadores", {})
        required_indicators = ["cumplimiento", "kyc", "control_10", "aml"]
        
        for ind in required_indicators:
            assert ind in indicadores, f"Missing indicator: {ind}"
            
            # Each indicator should have score, label, detalle, color
            ind_data = indicadores[ind]
            assert "score" in ind_data, f"Indicator {ind} missing 'score'"
            assert "label" in ind_data, f"Indicator {ind} missing 'label'"
            assert "detalle" in ind_data, f"Indicator {ind} missing 'detalle'"
            assert "color" in ind_data, f"Indicator {ind} missing 'color'"
            
            # Validate color
            assert ind_data["color"] in ["verde", "ambar", "rojo"], f"Invalid color for {ind}: {ind_data['color']}"
            
            print(f"✓ Indicator {ind}: {ind_data['score']}% ({ind_data['color']})")
    
    def test_semaforo_control_10_has_porcentaje(self):
        """Control 10% indicator has porcentaje field"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/semaforo")
        assert response.status_code == 200
        data = response.json()
        
        control_10 = data.get("indicadores", {}).get("control_10", {})
        assert "porcentaje" in control_10, "control_10 missing 'porcentaje' field"
        
        print(f"✓ Control 10%: {control_10['porcentaje']}% actividades no relacionadas")
    
    def test_semaforo_score_calculation(self):
        """Verify score_general is weighted average of 4 indicators"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/semaforo")
        assert response.status_code == 200
        data = response.json()
        
        ind = data.get("indicadores", {})
        
        # Weights: cumplimiento 35%, kyc 25%, control10 20%, aml 20%
        expected_score = (
            ind["cumplimiento"]["score"] * 0.35 +
            ind["kyc"]["score"] * 0.25 +
            ind["control_10"]["score"] * 0.20 +
            ind["aml"]["score"] * 0.20
        )
        
        # Allow small rounding difference
        assert abs(data["score_general"] - expected_score) < 1, \
            f"Score mismatch: expected ~{expected_score:.1f}, got {data['score_general']}"
        
        print(f"✓ Score calculation verified: {data['score_general']}%")


class TestReportesOperativos:
    """Tests for the Reportes Operativos endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session for authenticated requests"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@donataria.org",
            "password": "Test1234!"
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_reportes_operativos_returns_200(self):
        """GET /api/dashboard/reportes-operativos returns 200"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/reportes-operativos")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Reportes Operativos endpoint returns 200")
    
    def test_reportes_has_resumen(self):
        """Reportes has resumen with total_donativos, total_monto, total_donantes_activos"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/reportes-operativos")
        assert response.status_code == 200
        data = response.json()
        
        assert "resumen" in data, "Missing 'resumen' field"
        resumen = data["resumen"]
        
        assert "total_donativos" in resumen, "Missing total_donativos"
        assert "total_monto" in resumen, "Missing total_monto"
        assert "total_donantes_activos" in resumen, "Missing total_donantes_activos"
        
        print(f"✓ Resumen: {resumen['total_donativos']} donativos, ${resumen['total_monto']:,.2f}, {resumen['total_donantes_activos']} donantes")
    
    def test_reportes_has_por_tipo(self):
        """Reportes has por_tipo array with tipo, count, monto"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/reportes-operativos")
        assert response.status_code == 200
        data = response.json()
        
        assert "por_tipo" in data, "Missing 'por_tipo' field"
        assert isinstance(data["por_tipo"], list), "por_tipo should be a list"
        
        if len(data["por_tipo"]) > 0:
            item = data["por_tipo"][0]
            assert "tipo" in item, "por_tipo item missing 'tipo'"
            assert "count" in item, "por_tipo item missing 'count'"
            assert "monto" in item, "por_tipo item missing 'monto'"
        
        print(f"✓ Por tipo: {len(data['por_tipo'])} tipos de donativo")
    
    def test_reportes_has_top_donantes(self):
        """Reportes has top_donantes with accumulation data"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/reportes-operativos")
        assert response.status_code == 200
        data = response.json()
        
        assert "top_donantes" in data, "Missing 'top_donantes' field"
        assert isinstance(data["top_donantes"], list), "top_donantes should be a list"
        
        if len(data["top_donantes"]) > 0:
            item = data["top_donantes"][0]
            required_fields = ["donante_id", "nombre", "rfc", "monto", "porcentaje", "acumulado_pct"]
            for field in required_fields:
                assert field in item, f"top_donantes item missing '{field}'"
        
        print(f"✓ Top donantes: {len(data['top_donantes'])} donantes listados")
    
    def test_reportes_has_concentracion_80_20(self):
        """Reportes has concentracion_80_20 analysis"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/reportes-operativos")
        assert response.status_code == 200
        data = response.json()
        
        assert "concentracion_80_20" in data, "Missing 'concentracion_80_20' field"
        c80 = data["concentracion_80_20"]
        
        required_fields = ["donantes_para_80_pct", "total_donantes", "porcentaje_concentracion", "alerta_concentracion"]
        for field in required_fields:
            assert field in c80, f"concentracion_80_20 missing '{field}'"
        
        assert isinstance(c80["alerta_concentracion"], bool), "alerta_concentracion should be boolean"
        
        print(f"✓ Concentracion 80/20: {c80['donantes_para_80_pct']}/{c80['total_donantes']} donantes = {c80['porcentaje_concentracion']}%")
    
    def test_reportes_has_especie(self):
        """Reportes has especie section with total, monto, detalle"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/reportes-operativos")
        assert response.status_code == 200
        data = response.json()
        
        assert "especie" in data, "Missing 'especie' field"
        especie = data["especie"]
        
        assert "total" in especie, "especie missing 'total'"
        assert "monto" in especie, "especie missing 'monto'"
        assert "detalle" in especie, "especie missing 'detalle'"
        assert isinstance(especie["detalle"], list), "especie.detalle should be a list"
        
        print(f"✓ Especie: {especie['total']} donativos, ${especie['monto']:,.2f}")
    
    def test_reportes_has_extranjero(self):
        """Reportes has extranjero section with total, monto, detalle"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/reportes-operativos")
        assert response.status_code == 200
        data = response.json()
        
        assert "extranjero" in data, "Missing 'extranjero' field"
        extranjero = data["extranjero"]
        
        assert "total" in extranjero, "extranjero missing 'total'"
        assert "monto" in extranjero, "extranjero missing 'monto'"
        assert "detalle" in extranjero, "extranjero missing 'detalle'"
        assert isinstance(extranjero["detalle"], list), "extranjero.detalle should be a list"
        
        print(f"✓ Extranjero: {extranjero['total']} donativos, ${extranjero['monto']:,.2f}")
    
    def test_reportes_has_conciliacion(self):
        """Reportes has conciliacion CFDI section"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/reportes-operativos")
        assert response.status_code == 200
        data = response.json()
        
        assert "conciliacion" in data, "Missing 'conciliacion' field"
        conc = data["conciliacion"]
        
        required_fields = [
            "donativos_total", "donativos_con_cfdi", "donativos_sin_cfdi",
            "cfdis_emitidos", "cfdis_timbrados", "cfdis_cancelados",
            "donativos_con_cfdi_cancelado"
        ]
        for field in required_fields:
            assert field in conc, f"conciliacion missing '{field}'"
        
        # Verify consistency
        assert conc["donativos_con_cfdi"] + conc["donativos_sin_cfdi"] == conc["donativos_total"], \
            "donativos_con_cfdi + donativos_sin_cfdi should equal donativos_total"
        
        print(f"✓ Conciliacion: {conc['donativos_con_cfdi']}/{conc['donativos_total']} con CFDI, {conc['cfdis_timbrados']} timbrados")


class TestFichaPublica:
    """Tests for the Ficha Publica endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session for authenticated requests"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@donataria.org",
            "password": "Test1234!"
        })
        if login_response.status_code != 200:
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_ficha_publica_returns_200(self):
        """GET /api/dashboard/ficha-publica returns 200"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/ficha-publica")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Ficha Publica endpoint returns 200")
    
    def test_ficha_has_organizacion(self):
        """Ficha has organizacion with nombre, rfc, rubro"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/ficha-publica")
        assert response.status_code == 200
        data = response.json()
        
        assert "organizacion" in data, "Missing 'organizacion' field"
        org = data["organizacion"]
        
        assert "nombre" in org, "organizacion missing 'nombre'"
        assert "rfc" in org, "organizacion missing 'rfc'"
        assert "rubro" in org, "organizacion missing 'rubro'"
        
        print(f"✓ Organizacion: {org['nombre']} ({org['rfc']})")
    
    def test_ficha_has_ingresos_egresos(self):
        """Ficha has ingresos_egresos with financial data"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/ficha-publica")
        assert response.status_code == 200
        data = response.json()
        
        assert "ingresos_egresos" in data, "Missing 'ingresos_egresos' field"
        ie = data["ingresos_egresos"]
        
        required_fields = [
            "total_donativos_recibidos", "total_donativos_especie",
            "total_gastos_admin", "total_donativos_otorgados",
            "porcentaje_gastos_admin"
        ]
        for field in required_fields:
            assert field in ie, f"ingresos_egresos missing '{field}'"
        
        print(f"✓ Ingresos/Egresos: ${ie['total_donativos_recibidos']:,.2f} recibidos, {ie['porcentaje_gastos_admin']}% gastos admin")
    
    def test_ficha_has_actividades(self):
        """Ficha has actividades with descripcion and numero_beneficiarios"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/ficha-publica")
        assert response.status_code == 200
        data = response.json()
        
        assert "actividades" in data, "Missing 'actividades' field"
        act = data["actividades"]
        
        assert "numero_beneficiarios" in act, "actividades missing 'numero_beneficiarios'"
        # descripcion can be null
        
        print(f"✓ Actividades: {act['numero_beneficiarios']} beneficiarios")
    
    def test_ficha_has_donantes_activos(self):
        """Ficha has donantes_activos count"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/ficha-publica")
        assert response.status_code == 200
        data = response.json()
        
        assert "donantes_activos" in data, "Missing 'donantes_activos' field"
        assert isinstance(data["donantes_activos"], int), "donantes_activos should be integer"
        
        print(f"✓ Donantes activos: {data['donantes_activos']}")
    
    def test_ficha_has_estado_informe(self):
        """Ficha has estado_informe field"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/ficha-publica")
        assert response.status_code == 200
        data = response.json()
        
        assert "estado_informe" in data, "Missing 'estado_informe' field"
        valid_estados = ["sin_informe", "borrador", "presentado"]
        assert data["estado_informe"] in valid_estados, f"Invalid estado_informe: {data['estado_informe']}"
        
        print(f"✓ Estado informe: {data['estado_informe']}")


class TestUnauthenticatedAccess:
    """Tests for unauthenticated access to endpoints"""
    
    def test_semaforo_requires_auth(self):
        """Semaforo endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/dashboard/semaforo")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Semaforo requires authentication")
    
    def test_reportes_operativos_requires_auth(self):
        """Reportes Operativos endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/dashboard/reportes-operativos")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Reportes Operativos requires authentication")
    
    def test_ficha_publica_requires_auth(self):
        """Ficha Publica endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/dashboard/ficha-publica")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Ficha Publica requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
