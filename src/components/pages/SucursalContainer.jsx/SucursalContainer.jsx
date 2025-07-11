import React, { useState, useEffect } from "react";
import { collection, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import SucursalForm from "../formularioSucursal/SucursalForm";
import ListaSucursales from "./ListaSucursales";
import { Alert, Box, Typography, Tabs, Tab, Paper, Button } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SucursalContainer = () => {
  const { empresaId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // Ahora el listado es el tab 0
  const [refreshList, setRefreshList] = useState(false);
  const [empresa, setEmpresa] = useState(null);
  const [canAccessEmpresa, setCanAccessEmpresa] = useState(false);
  const { userProfile, role, canViewEmpresa } = useAuth();

  useEffect(() => {
    const fetchEmpresa = async () => {
      if (!empresaId) return;
      try {
        const docRef = doc(db, "empresas", empresaId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const empresaData = {
            id: empresaId,
            nombre: docSnap.data().nombre,
            logo: docSnap.data().logo || "",
            propietarioId: docSnap.data().propietarioId
          };
          setEmpresa(empresaData);
          
          // Verificar si el usuario puede acceder a esta empresa
          const tieneAcceso = canViewEmpresa(empresaId);
          setCanAccessEmpresa(tieneAcceso);
          
          if (!tieneAcceso) {
            setError("No tienes permisos para acceder a esta empresa.");
          }
        } else {
          setEmpresa(null);
          setError("Empresa no encontrada.");
        }
      } catch (e) {
        setEmpresa(null);
        setError("Error al cargar la empresa.");
      }
    };
    fetchEmpresa();
  }, [empresaId, canViewEmpresa]);

  const agregarSucursal = async (sucursal) => {
    try {
      setError(null);
      setSuccess(null);
      
      // Verificar permisos antes de crear la sucursal
      if (!canAccessEmpresa) {
        setError("No tienes permisos para crear sucursales en esta empresa.");
        return;
      }
      
      const sucursalRef = collection(db, "sucursales");
      await addDoc(sucursalRef, {
        ...sucursal,
        empresaId: empresaId,
        fechaCreacion: Timestamp.now(),
        // Agregar información del usuario que crea la sucursal
        creadoPor: userProfile?.uid,
        creadoPorEmail: userProfile?.email,
        clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid
      });
      
      setSuccess(`Sucursal "${sucursal.nombre}" agregada exitosamente.`);
      setRefreshList(!refreshList);
      setActiveTab(0);
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
    } catch (error) {
      console.error("Error al agregar sucursal:", error);
      setError("Error al agregar la sucursal. Por favor, intente nuevamente.");
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Si no tiene acceso a la empresa, mostrar mensaje de error
  if (!canAccessEmpresa && empresaId) {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={2}>
          <Button
            onClick={() => navigate('/establecimiento')}
            color="primary"
            sx={{ fontWeight: 'bold', textTransform: 'none', mr: 2 }}
            startIcon={<ArrowBackIcon />}
            size="large"
          >
            Atrás
          </Button>
          <Typography variant="h4" gutterBottom>
            Gestión de Sucursales
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "No tienes permisos para acceder a esta empresa."}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <Button
          onClick={() => navigate('/establecimiento')}
          color="primary"
          sx={{ fontWeight: 'bold', textTransform: 'none', mr: 2 }}
          startIcon={<ArrowBackIcon />}
          size="large"
        >
          Atrás
        </Button>
        <Typography variant="h4" gutterBottom>
          Gestión de Sucursales
        </Typography>
      </Box>
      {/* Mostrar nombre y logo de la empresa seleccionada */}
      {empresa && (
        <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', minWidth: 'fit-content' }}>
            Empresa:
          </Typography>
          <Typography variant="h6" color="primary" sx={{ flex: 1 }}>
            {empresa.nombre}
          </Typography>
          {empresa.logo && empresa.logo.trim() !== "" ? (
            <img
              src={empresa.logo}
              alt={`Logo de ${empresa.nombre}`}
              style={{ width: "60px", height: "60px", objectFit: 'contain', borderRadius: '8px' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <Box
              sx={{
                width: "60px",
                height: "60px",
                backgroundColor: "#f0f0f0",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                color: "#666",
                border: "2px dashed #ccc"
              }}
            >
              {empresa.nombre.charAt(0).toUpperCase()}
            </Box>
          )}
        </Paper>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Ver Sucursales" />
        <Tab label="Agregar Sucursal" />
      </Tabs>
      {activeTab === 0 && (
        <ListaSucursales key={refreshList} empresaId={empresaId} />
      )}
      {activeTab === 1 && (
        <SucursalForm agregarSucursal={agregarSucursal} empresaId={empresaId} />
      )}
    </Box>
  );
};

export default SucursalContainer;
