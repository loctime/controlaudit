import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Button, TextField, Typography, Box } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

const PERMISOS_LISTA = [
  { key: 'puedeCrearEmpresas', label: 'Crear Empresas' },
  { key: 'puedeCrearSucursales', label: 'Crear Sucursales' },
  { key: 'puedeCrearAuditorias', label: 'Crear Auditorías' },
  { key: 'puedeCompartirAuditorias', label: 'Compartir Auditorías' },
  { key: 'puedeAgregarSocios', label: 'Agregar Socios' }
];

const OperariosManager = () => {
  const { role, userProfile, crearOperario, editarPermisosOperario } = useAuth();
  const [operarios, setOperarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [editando, setEditando] = useState({});

  // Cargar operarios con filtrado multi-tenant
  const fetchOperarios = async () => {
    setLoading(true);
    try {
      const usuariosRef = collection(db, 'usuarios');
      const snapshot = await getDocs(usuariosRef);
      let lista = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.role === 'operario');

      // Filtrar según el rol del usuario actual
      if (role === 'max') {
        // Clientes administradores solo ven sus operarios
        lista = lista.filter(operario => operario.clienteAdminId === userProfile?.uid);
      }
      // Super administradores ven todos los operarios (no se filtra)

      setOperarios(lista);
    } catch (e) {
      toast.error('Error al cargar operarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperarios();
  }, []);

  // Crear operario
  const handleCrearOperario = async () => {
    if (!nuevoEmail) return;
    try {
      await crearOperario(nuevoEmail);
      toast.success('Operario creado');
      setNuevoEmail('');
      fetchOperarios();
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Editar permisos
  const handlePermisoChange = (userId, key, value) => {
    setEditando(prev => ({
      ...prev,
      [userId]: {
        ...operarios.find(o => o.id === userId)?.permisos,
        ...prev[userId],
        [key]: value
      }
    }));
  };

  const handleGuardarPermisos = async (userId) => {
    try {
      await editarPermisosOperario(userId, editando[userId]);
      toast.success('Permisos actualizados');
      setEditando(prev => ({ ...prev, [userId]: undefined }));
      fetchOperarios();
    } catch (e) {
      toast.error('Error al actualizar permisos');
    }
  };

  // Verificar permisos multi-tenant
  if (role !== 'max' && role !== 'supermax') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Acceso restringido solo para administradores (max) y super administradores (supermax).
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Gestión de Operarios</Typography>
      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="Email del nuevo operario"
          value={nuevoEmail}
          onChange={e => setNuevoEmail(e.target.value)}
          size="small"
        />
        <Button variant="contained" onClick={handleCrearOperario}>Crear Operario</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              {PERMISOS_LISTA.map(p => (
                <TableCell key={p.key}>{p.label}</TableCell>
              ))}
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {operarios.map(op => (
              <TableRow key={op.id}>
                <TableCell>{op.email}</TableCell>
                {PERMISOS_LISTA.map(p => (
                  <TableCell key={p.key}>
                    <Checkbox
                      checked={editando[op.id]?.[p.key] ?? op.permisos?.[p.key] ?? false}
                      onChange={e => handlePermisoChange(op.id, p.key, e.target.checked)}
                      inputProps={{ 'aria-label': p.label }}
                    />
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleGuardarPermisos(op.id)}
                    disabled={!editando[op.id]}
                  >
                    Guardar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OperariosManager; 