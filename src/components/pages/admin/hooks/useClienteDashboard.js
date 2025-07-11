// src/components/pages/admin/hooks/useClienteDashboard.js
import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, serverTimestamp, limit, orderBy } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { AuthContext } from "../../../context/AuthContext";
import { toast } from 'react-toastify';

export const useClienteDashboard = () => {
  const { userProfile, role } = useContext(AuthContext);
  const [auditorias, setAuditorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    empresas: true,
    sucursales: true,
    formularios: true,
    auditorias: true
  });

  // ✅ Función optimizada para cargar empresas
  const cargarEmpresas = useCallback(async () => {
    try {
      if (!userProfile) return [];

      let empresasData = [];
      if (role === 'supermax') {
        const empresasSnapshot = await getDocs(collection(db, 'empresas'));
        empresasData = empresasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'max') {
        // Cargar empresas propias
        const empresasRef = collection(db, "empresas");
        const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.uid));
        const empresasSnapshot = await getDocs(empresasQuery);
        const misEmpresas = empresasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Cargar usuarios operarios y sus empresas en paralelo
        const usuariosRef = collection(db, "usuarios");
        const usuariosQuery = query(usuariosRef, where("clienteAdminId", "==", userProfile.uid));
        const usuariosSnapshot = await getDocs(usuariosQuery);
        const usuariosOperarios = usuariosSnapshot.docs.map(doc => doc.id);

        // Cargar empresas de operarios en paralelo
        const empresasOperariosPromises = usuariosOperarios.map(async (operarioId) => {
          const operarioEmpresasQuery = query(empresasRef, where("propietarioId", "==", operarioId));
          const operarioEmpresasSnapshot = await getDocs(operarioEmpresasQuery);
          return operarioEmpresasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        });

        const empresasOperariosArrays = await Promise.all(empresasOperariosPromises);
        const empresasOperarios = empresasOperariosArrays.flat();

        empresasData = [...misEmpresas, ...empresasOperarios];
      }
      return empresasData;
    } catch (error) {
      console.error('Error cargando empresas:', error);
      return [];
    }
  }, [userProfile, role]);

  // ✅ Función optimizada para cargar sucursales
  const cargarSucursales = useCallback(async (empresasData) => {
    try {
      if (!userProfile || !empresasData.length) return [];

      let sucursalesData = [];
      if (role === 'supermax') {
        const sucursalesSnapshot = await getDocs(collection(db, 'sucursales'));
        sucursalesData = sucursalesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'max') {
        const empresasIds = empresasData.map(emp => emp.nombre);
        // Firestore limita 'in' queries a 10 elementos, dividir en chunks si es necesario
        const chunkSize = 10;
        const empresasChunks = [];
        for (let i = 0; i < empresasIds.length; i += chunkSize) {
          empresasChunks.push(empresasIds.slice(i, i + chunkSize));
        }

        const sucursalesPromises = empresasChunks.map(async (chunk) => {
          const sucursalesRef = collection(db, "sucursales");
          const sucursalesQuery = query(sucursalesRef, where("empresa", "in", chunk));
          const sucursalesSnapshot = await getDocs(sucursalesQuery);
          return sucursalesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        });

        const sucursalesArrays = await Promise.all(sucursalesPromises);
        sucursalesData = sucursalesArrays.flat();
      }
      return sucursalesData;
    } catch (error) {
      console.error('Error cargando sucursales:', error);
      return [];
    }
  }, [userProfile, role]);

  // ✅ Función optimizada para cargar formularios
  const cargarFormularios = useCallback(async () => {
    try {
      if (!userProfile) return [];

      let formulariosData = [];
      if (role === 'supermax') {
        const formulariosSnapshot = await getDocs(collection(db, 'formularios'));
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'max') {
        // Cargar formularios propios
        const formulariosRef = collection(db, "formularios");
        const formulariosQuery = query(formulariosRef, where("clienteAdminId", "==", userProfile.uid));
        const formulariosSnapshot = await getDocs(formulariosQuery);
        const misFormularios = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Cargar usuarios operarios
        const usuariosRef = collection(db, "usuarios");
        const usuariosQuery = query(usuariosRef, where("clienteAdminId", "==", userProfile.uid));
        const usuariosSnapshot = await getDocs(usuariosQuery);
        const usuariosOperarios = usuariosSnapshot.docs.map(doc => doc.id);

        // Cargar formularios de operarios en paralelo
        const formulariosOperariosPromises = usuariosOperarios.map(async (operarioId) => {
          const operarioFormulariosQuery = query(formulariosRef, where("clienteAdminId", "==", operarioId));
          const operarioFormulariosSnapshot = await getDocs(operarioFormulariosQuery);
          return operarioFormulariosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        });

        const formulariosOperariosArrays = await Promise.all(formulariosOperariosPromises);
        const formulariosOperarios = formulariosOperariosArrays.flat();

        formulariosData = [...misFormularios, ...formulariosOperarios];
      }
      return formulariosData;
    } catch (error) {
      console.error('Error cargando formularios:', error);
      return [];
    }
  }, [userProfile, role]);

  // ✅ Función optimizada para cargar auditorías con paginación
  const cargarAuditorias = useCallback(async () => {
    try {
      if (!userProfile) return [];

      let auditoriasData = [];
      if (role === 'supermax') {
        // Cargar solo las últimas 50 auditorías para supermax
        const auditoriasRef = collection(db, 'auditorias_agendadas');
        const auditoriasQuery = query(
          auditoriasRef, 
          orderBy('fechaCreacion', 'desc'), 
          limit(50)
        );
        const auditoriasSnapshot = await getDocs(auditoriasQuery);
        auditoriasData = auditoriasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'max') {
        // Cargar auditorías propias
        const auditoriasRef = collection(db, "auditorias_agendadas");
        const auditoriasQuery = query(
          auditoriasRef, 
          where("usuarioId", "==", userProfile.uid),
          orderBy('fechaCreacion', 'desc'),
          limit(30)
        );
        const auditoriasSnapshot = await getDocs(auditoriasQuery);
        const misAuditorias = auditoriasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Cargar usuarios operarios
        const usuariosRef = collection(db, "usuarios");
        const usuariosQuery = query(usuariosRef, where("clienteAdminId", "==", userProfile.uid));
        const usuariosSnapshot = await getDocs(usuariosQuery);
        const usuariosOperarios = usuariosSnapshot.docs.map(doc => doc.id);

        // Cargar auditorías de operarios en paralelo (limitadas a 20 por operario)
        const auditoriasOperariosPromises = usuariosOperarios.map(async (operarioId) => {
          const operarioAuditoriasQuery = query(
            auditoriasRef, 
            where("usuarioId", "==", operarioId),
            orderBy('fechaCreacion', 'desc'),
            limit(20)
          );
          const operarioAuditoriasSnapshot = await getDocs(operarioAuditoriasQuery);
          return operarioAuditoriasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        });

        const auditoriasOperariosArrays = await Promise.all(auditoriasOperariosPromises);
        const auditoriasOperarios = auditoriasOperariosArrays.flat();

        auditoriasData = [...misAuditorias, ...auditoriasOperarios];
      }
      return auditoriasData;
    } catch (error) {
      console.error('Error cargando auditorías:', error);
      return [];
    }
  }, [userProfile, role]);

  // ✅ Cargar datos en paralelo para mejor rendimiento
  useEffect(() => {
    const cargarDatosParalelos = async () => {
      try {
        if (!userProfile) return;

        console.log('[DEBUG] Iniciando carga paralela de datos...');
        
        // Cargar empresas primero (necesarias para sucursales)
        setLoadingStates(prev => ({ ...prev, empresas: true }));
        const empresasData = await cargarEmpresas();
        setEmpresas(empresasData);
        setLoadingStates(prev => ({ ...prev, empresas: false }));

        // Cargar el resto en paralelo
        const [sucursalesData, formulariosData, auditoriasData] = await Promise.all([
          cargarSucursales(empresasData),
          cargarFormularios(),
          cargarAuditorias()
        ]);

        setSucursales(sucursalesData);
        setFormularios(formulariosData);
        setAuditorias(auditoriasData);

        setLoadingStates({
          empresas: false,
          sucursales: false,
          formularios: false,
          auditorias: false
        });

        console.log('[DEBUG] Datos cargados con optimización:', {
          empresas: empresasData.length,
          sucursales: sucursalesData.length,
          formularios: formulariosData.length,
          auditorias: auditoriasData.length
        });

      } catch (error) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar los datos');
        setLoadingStates({
          empresas: false,
          sucursales: false,
          formularios: false,
          auditorias: false
        });
      } finally {
        setLoading(false);
      }
    };

    cargarDatosParalelos();
  }, [userProfile, role, cargarEmpresas, cargarSucursales, cargarFormularios, cargarAuditorias]);

  // ✅ Memoizar datos calculados para evitar recálculos
  const auditoriasPendientes = useMemo(() => 
    auditorias.filter(aud => aud.estado === 'agendada'), 
    [auditorias]
  );

  const auditoriasCompletadas = useMemo(() => 
    auditorias.filter(aud => aud.estado === 'completada'), 
    [auditorias]
  );

  const auditoriasDelDia = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return auditorias.filter(auditoria => auditoria.fecha === today);
  }, [auditorias]);

  const proximasAuditorias = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return auditorias
      .filter(auditoria => auditoria.fecha >= today && auditoria.estado === 'agendada')
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(0, 5);
  }, [auditorias]);

  // ✅ Funciones optimizadas con useCallback
  const handleAgendarAuditoria = useCallback(async (formData) => {
    try {
      const nuevaAuditoria = {
        ...formData,
        fecha: formData.fecha,
        hora: formData.hora,
        estado: 'agendada',
        usuarioId: userProfile?.uid,
        usuarioNombre: userProfile?.displayName || userProfile?.email,
        clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'auditorias_agendadas'), nuevaAuditoria);
      
      setAuditorias(prev => [{
        id: docRef.id,
        ...nuevaAuditoria,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      }, ...prev]);
      
      toast.success('Auditoría agendada exitosamente');
      return true;
    } catch (error) {
      console.error('Error agendando auditoría:', error);
      toast.error('Error al agendar la auditoría');
      return false;
    }
  }, [userProfile]);

  const handleCompletarAuditoria = useCallback(async (auditoriaId) => {
    try {
      const auditoriaRef = doc(db, 'auditorias_agendadas', auditoriaId);
      await updateDoc(auditoriaRef, {
        estado: 'completada',
        fechaCompletada: serverTimestamp()
      });

      setAuditorias(prev => prev.map(aud => 
        aud.id === auditoriaId 
          ? { ...aud, estado: 'completada', fechaCompletada: new Date() }
          : aud
      ));
      toast.success('Auditoría marcada como completada');
    } catch (error) {
      console.error('Error completando auditoría:', error);
      toast.error('Error al marcar como completada');
    }
  }, []);

  const handleEliminarAuditoria = useCallback(async (auditoriaId) => {
    try {
      await deleteDoc(doc(db, 'auditorias_agendadas', auditoriaId));
      setAuditorias(prev => prev.filter(aud => aud.id !== auditoriaId));
      toast.success('Auditoría eliminada');
    } catch (error) {
      console.error('Error eliminando auditoría:', error);
      toast.error('Error al eliminar la auditoría');
    }
  }, []);

  return {
    auditorias,
    empresas,
    sucursales,
    formularios,
    loading,
    loadingStates,
    auditoriasPendientes,
    auditoriasCompletadas,
    auditoriasDelDia,
    proximasAuditorias,
    handleAgendarAuditoria,
    handleCompletarAuditoria,
    handleEliminarAuditoria
  };
}; 