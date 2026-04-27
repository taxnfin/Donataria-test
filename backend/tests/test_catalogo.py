"""
Test suite for Catálogo de Donatarias Autorizadas feature
Tests: catalog listing, filtering, detail view, linking/unlinking donors
"""
import pytest
import requests
import os

# BASE_URL imported from conftest

# Test credentials
from conftest import TEST_EMAIL, TEST_PASSWORD, BASE_URL


class TestCatalogoPublicEndpoints:
    """Test public catalog endpoints (no auth required)"""
    
    def test_get_catalogo_donatarias_returns_paginated_list(self):
        """GET /api/catalogo/donatarias returns paginated list with ~134 items"""
        response = requests.get(f"{BASE_URL}/api/catalogo/donatarias")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total" in data, "Response should have 'total' field"
        assert "items" in data, "Response should have 'items' field"
        assert isinstance(data["items"], list), "Items should be a list"
        
        # Verify we have ~134 entries (seed data)
        assert data["total"] >= 130, f"Expected ~134 entries, got {data['total']}"
        print(f"✓ Catalog has {data['total']} donatarias")
        
        # Verify item structure
        if data["items"]:
            item = data["items"][0]
            assert "catalogo_id" in item, "Item should have catalogo_id"
            assert "nombre" in item, "Item should have nombre"
            assert "rfc" in item, "Item should have rfc"
            assert "giro" in item, "Item should have giro"
            assert "estatus_sat" in item, "Item should have estatus_sat"
            assert "estado" in item, "Item should have estado"
            print(f"✓ Item structure verified: {item['nombre']}")
    
    def test_search_cruz_roja(self):
        """GET /api/catalogo/donatarias?search=Cruz+Roja returns filtered results"""
        response = requests.get(f"{BASE_URL}/api/catalogo/donatarias?search=Cruz+Roja")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 1, "Should find at least 1 Cruz Roja entry"
        
        # Verify search result contains Cruz Roja
        found = False
        for item in data["items"]:
            if "Cruz Roja" in item["nombre"]:
                found = True
                print(f"✓ Found: {item['nombre']} ({item['rfc']})")
                break
        assert found, "Should find Cruz Roja Mexicana in results"
    
    def test_filter_by_giro_ecologica(self):
        """GET /api/catalogo/donatarias?giro=ecologica returns only ecological orgs"""
        response = requests.get(f"{BASE_URL}/api/catalogo/donatarias?giro=ecologica")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 1, "Should find ecological organizations"
        
        # Verify all results have giro=ecologica
        for item in data["items"]:
            assert item["giro"] == "ecologica", f"Expected giro=ecologica, got {item['giro']}"
        print(f"✓ Found {data['total']} ecological organizations")
    
    def test_filter_by_estatus_revocada(self):
        """GET /api/catalogo/donatarias?estatus_sat=revocada returns revoked entries"""
        response = requests.get(f"{BASE_URL}/api/catalogo/donatarias?estatus_sat=revocada")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 1, "Should find revoked entries (seed data has 2)"
        
        # Verify all results have estatus_sat=revocada
        for item in data["items"]:
            assert item["estatus_sat"] == "revocada", f"Expected estatus_sat=revocada, got {item['estatus_sat']}"
        print(f"✓ Found {data['total']} revoked entries")
    
    def test_filter_by_estado(self):
        """GET /api/catalogo/donatarias?estado=Nuevo+León returns entries from that state"""
        response = requests.get(f"{BASE_URL}/api/catalogo/donatarias?estado=Nuevo+León")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 1, "Should find entries from Nuevo León"
        
        for item in data["items"]:
            assert item["estado"] == "Nuevo León", f"Expected estado=Nuevo León, got {item['estado']}"
        print(f"✓ Found {data['total']} entries from Nuevo León")
    
    def test_get_giros_list(self):
        """GET /api/catalogo/donatarias/giros returns list of giros, estados, and estatus"""
        response = requests.get(f"{BASE_URL}/api/catalogo/donatarias/giros")
        assert response.status_code == 200
        
        data = response.json()
        assert "giros" in data, "Response should have 'giros' field"
        assert "estados" in data, "Response should have 'estados' field"
        assert "estatus" in data, "Response should have 'estatus' field"
        
        # Verify expected giros
        expected_giros = ["asistencial", "becas", "cultural", "derechos_humanos", 
                         "desarrollo_social", "ecologica", "educativa", "investigacion", "salud"]
        for giro in expected_giros:
            assert giro in data["giros"], f"Expected giro '{giro}' in list"
        print(f"✓ Found {len(data['giros'])} giros: {data['giros']}")
        
        # Verify estatus
        assert "autorizada" in data["estatus"], "Should have 'autorizada' estatus"
        assert "revocada" in data["estatus"], "Should have 'revocada' estatus"
        assert "en_proceso" in data["estatus"], "Should have 'en_proceso' estatus"
        print(f"✓ Found estatus: {data['estatus']}")
        
        # Verify estados (should have multiple Mexican states)
        assert len(data["estados"]) >= 10, f"Expected at least 10 states, got {len(data['estados'])}"
        print(f"✓ Found {len(data['estados'])} estados")
    
    def test_get_catalogo_detail(self):
        """GET /api/catalogo/donatarias/{catalogo_id} returns detail with vinculados_count"""
        # First get a catalog item
        list_response = requests.get(f"{BASE_URL}/api/catalogo/donatarias?limit=1")
        assert list_response.status_code == 200
        items = list_response.json()["items"]
        assert len(items) > 0, "Should have at least one catalog item"
        
        catalogo_id = items[0]["catalogo_id"]
        
        # Get detail
        response = requests.get(f"{BASE_URL}/api/catalogo/donatarias/{catalogo_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "catalogo_id" in data, "Detail should have catalogo_id"
        assert "nombre" in data, "Detail should have nombre"
        assert "vinculados_count" in data, "Detail should have vinculados_count"
        assert isinstance(data["vinculados_count"], int), "vinculados_count should be integer"
        print(f"✓ Detail for {data['nombre']}: vinculados_count={data['vinculados_count']}")
    
    def test_get_catalogo_detail_not_found(self):
        """GET /api/catalogo/donatarias/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/catalogo/donatarias/cat_invalid123")
        assert response.status_code == 404


class TestCatalogoAuthenticatedEndpoints:
    """Test authenticated catalog endpoints (linking/unlinking donors)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.text}")
        print(f"✓ Logged in as {TEST_EMAIL}")
    
    def test_create_donante_and_link_to_catalog(self):
        """POST /api/catalogo/donatarias/{catalogo_id}/vincular links a donor to catalog entry"""
        # Step 1: Create a test donante
        donante_data = {
            "nombre": "TEST_Donante_Catalogo",
            "rfc": "TEDC900101XX0",
            "email": "test_catalogo@example.com",
            "tipo_persona": "fisica"
        }
        create_response = self.session.post(f"{BASE_URL}/api/donantes", json=donante_data)
        assert create_response.status_code in [200, 201], f"Failed to create donante: {create_response.text}"
        donante_id = create_response.json()["donante_id"]
        print(f"✓ Created test donante: {donante_id}")
        
        # Step 2: Get a catalog entry
        catalog_response = requests.get(f"{BASE_URL}/api/catalogo/donatarias?limit=1")
        assert catalog_response.status_code == 200
        catalogo_id = catalog_response.json()["items"][0]["catalogo_id"]
        catalogo_nombre = catalog_response.json()["items"][0]["nombre"]
        print(f"✓ Using catalog entry: {catalogo_nombre}")
        
        # Step 3: Link donante to catalog entry
        link_response = self.session.post(
            f"{BASE_URL}/api/catalogo/donatarias/{catalogo_id}/vincular?donante_id={donante_id}"
        )
        assert link_response.status_code == 200, f"Failed to link: {link_response.text}"
        assert "link_id" in link_response.json(), "Response should have link_id"
        print(f"✓ Linked donante to catalog entry")
        
        # Step 4: Verify link by getting vinculados
        vinculados_response = self.session.get(
            f"{BASE_URL}/api/catalogo/donatarias/{catalogo_id}/vinculados"
        )
        assert vinculados_response.status_code == 200
        vinculados = vinculados_response.json()
        found = any(v["donante_id"] == donante_id for v in vinculados)
        assert found, "Donante should be in vinculados list"
        print(f"✓ Verified donante in vinculados list")
        
        # Step 5: Unlink donante
        unlink_response = self.session.delete(
            f"{BASE_URL}/api/catalogo/donatarias/{catalogo_id}/vincular/{donante_id}"
        )
        assert unlink_response.status_code == 200, f"Failed to unlink: {unlink_response.text}"
        print(f"✓ Unlinked donante from catalog entry")
        
        # Step 6: Verify unlink
        vinculados_response2 = self.session.get(
            f"{BASE_URL}/api/catalogo/donatarias/{catalogo_id}/vinculados"
        )
        vinculados2 = vinculados_response2.json()
        found2 = any(v["donante_id"] == donante_id for v in vinculados2)
        assert not found2, "Donante should NOT be in vinculados list after unlink"
        print(f"✓ Verified donante removed from vinculados list")
        
        # Cleanup: Delete test donante
        self.session.delete(f"{BASE_URL}/api/donantes/{donante_id}")
        print(f"✓ Cleaned up test donante")
    
    def test_link_duplicate_returns_400(self):
        """POST /api/catalogo/donatarias/{catalogo_id}/vincular returns 400 for duplicate link"""
        # Create donante
        donante_data = {
            "nombre": "TEST_Donante_Duplicate",
            "rfc": "TEDD900101XX0",
            "email": "test_dup@example.com",
            "tipo_persona": "fisica"
        }
        create_response = self.session.post(f"{BASE_URL}/api/donantes", json=donante_data)
        assert create_response.status_code in [200, 201]
        donante_id = create_response.json()["donante_id"]
        
        # Get catalog entry
        catalog_response = requests.get(f"{BASE_URL}/api/catalogo/donatarias?limit=1")
        catalogo_id = catalog_response.json()["items"][0]["catalogo_id"]
        
        # Link first time
        link1 = self.session.post(
            f"{BASE_URL}/api/catalogo/donatarias/{catalogo_id}/vincular?donante_id={donante_id}"
        )
        assert link1.status_code == 200
        
        # Link second time - should fail
        link2 = self.session.post(
            f"{BASE_URL}/api/catalogo/donatarias/{catalogo_id}/vincular?donante_id={donante_id}"
        )
        assert link2.status_code == 400, f"Expected 400 for duplicate, got {link2.status_code}"
        print(f"✓ Duplicate link correctly returns 400")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/catalogo/donatarias/{catalogo_id}/vincular/{donante_id}")
        self.session.delete(f"{BASE_URL}/api/donantes/{donante_id}")
    
    def test_link_invalid_donante_returns_404(self):
        """POST /api/catalogo/donatarias/{catalogo_id}/vincular returns 404 for invalid donante"""
        catalog_response = requests.get(f"{BASE_URL}/api/catalogo/donatarias?limit=1")
        catalogo_id = catalog_response.json()["items"][0]["catalogo_id"]
        
        link_response = self.session.post(
            f"{BASE_URL}/api/catalogo/donatarias/{catalogo_id}/vincular?donante_id=invalid_donante_id"
        )
        assert link_response.status_code == 404, f"Expected 404, got {link_response.status_code}"
        print(f"✓ Invalid donante correctly returns 404")
    
    def test_link_invalid_catalog_returns_404(self):
        """POST /api/catalogo/donatarias/{invalid_id}/vincular returns 404"""
        # Create donante
        donante_data = {
            "nombre": "TEST_Donante_Invalid_Cat",
            "rfc": "TEIC900101XX0",
            "email": "test_inv@example.com",
            "tipo_persona": "fisica"
        }
        create_response = self.session.post(f"{BASE_URL}/api/donantes", json=donante_data)
        assert create_response.status_code in [200, 201]
        donante_id = create_response.json()["donante_id"]
        
        link_response = self.session.post(
            f"{BASE_URL}/api/catalogo/donatarias/cat_invalid123/vincular?donante_id={donante_id}"
        )
        assert link_response.status_code == 404, f"Expected 404, got {link_response.status_code}"
        print(f"✓ Invalid catalog ID correctly returns 404")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/donantes/{donante_id}")
    
    def test_unlink_nonexistent_returns_404(self):
        """DELETE /api/catalogo/donatarias/{catalogo_id}/vincular/{donante_id} returns 404 for nonexistent link"""
        catalog_response = requests.get(f"{BASE_URL}/api/catalogo/donatarias?limit=1")
        catalogo_id = catalog_response.json()["items"][0]["catalogo_id"]
        
        unlink_response = self.session.delete(
            f"{BASE_URL}/api/catalogo/donatarias/{catalogo_id}/vincular/nonexistent_donante"
        )
        assert unlink_response.status_code == 404, f"Expected 404, got {unlink_response.status_code}"
        print(f"✓ Nonexistent link correctly returns 404")
    
    def test_get_vinculados_empty(self):
        """GET /api/catalogo/donatarias/{catalogo_id}/vinculados returns empty list when no links"""
        # Get a catalog entry that likely has no links
        catalog_response = requests.get(f"{BASE_URL}/api/catalogo/donatarias?estatus_sat=revocada&limit=1")
        if catalog_response.json()["total"] == 0:
            pytest.skip("No revoked entries to test")
        
        catalogo_id = catalog_response.json()["items"][0]["catalogo_id"]
        
        vinculados_response = self.session.get(
            f"{BASE_URL}/api/catalogo/donatarias/{catalogo_id}/vinculados"
        )
        assert vinculados_response.status_code == 200
        assert isinstance(vinculados_response.json(), list)
        print(f"✓ Vinculados endpoint returns list (may be empty)")


class TestCatalogoPagination:
    """Test catalog pagination"""
    
    def test_pagination_limit_skip(self):
        """Test pagination with limit and skip parameters"""
        # Get first page
        page1 = requests.get(f"{BASE_URL}/api/catalogo/donatarias?limit=10&skip=0")
        assert page1.status_code == 200
        data1 = page1.json()
        
        # Get second page
        page2 = requests.get(f"{BASE_URL}/api/catalogo/donatarias?limit=10&skip=10")
        assert page2.status_code == 200
        data2 = page2.json()
        
        # Verify different items
        ids1 = {item["catalogo_id"] for item in data1["items"]}
        ids2 = {item["catalogo_id"] for item in data2["items"]}
        assert ids1.isdisjoint(ids2), "Pages should have different items"
        print(f"✓ Pagination working: page1 has {len(data1['items'])} items, page2 has {len(data2['items'])} items")
    
    def test_combined_filters_and_pagination(self):
        """Test combining filters with pagination"""
        response = requests.get(
            f"{BASE_URL}/api/catalogo/donatarias?giro=educativa&estado=Ciudad+de+México&limit=5"
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify all items match filters
        for item in data["items"]:
            assert item["giro"] == "educativa", f"Expected giro=educativa"
            assert item["estado"] == "Ciudad de México", f"Expected estado=Ciudad de México"
        print(f"✓ Combined filters working: found {data['total']} matching items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
