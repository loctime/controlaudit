import HomeIcon from '@mui/icons-material/Home';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ChecklistIcon from '@mui/icons-material/Checklist';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

// Configuración de menús por rol y permisos
export const getMenuItems = (role, permisos = {}) => {
  const baseItems = [
    {
      id: "dashboard",
      path: "/dashboard",
      title: "Panel de Control",
      Icon: HomeIcon,
      roles: ['operario', 'max', 'supermax'],
      required: true
    },
    {
      id: "cliente-dashboard",
      path: "/cliente-dashboard",
      title: "Calendario de Auditorías",
      Icon: CalendarTodayIcon,
      roles: ['max'],
      required: true
    },
    {
      id: "home",
      path: "/",
      title: "Inicio",
      Icon: HomeIcon,
      roles: ['operario', 'max', 'supermax'],
      required: true
    }
  ];

  const auditoriaItems = [
    {
      id: "auditoria",
      path: "/auditoria",
      title: "Auditoría",
      Icon: ChecklistIcon,
      roles: ['operario', 'max', 'supermax'],
      required: permisos.puedeCrearAuditorias || role === 'supermax'
    }
  ];

  const formularioItems = [
    {
      id: "formularios",
      path: "/formulario",
      title: "Formularios",
      Icon: FormatListBulletedOutlinedIcon,
      roles: ['max', 'supermax'],
      required: true
    },
    {
      id: "editar-formulario",
      path: "/editar",
      title: "Editar Formulario",
      Icon: FormatListBulletedOutlinedIcon,
      roles: ['max', 'supermax'],
      required: true
    }
  ];

  const empresaItems = [
    {
      id: "establecimiento",
      path: "/establecimiento",
      title: "Establecimientos",
      Icon: BusinessIcon,
      roles: ['max', 'supermax'],
      required: permisos.puedeCrearEmpresas || role === 'supermax'
    },
    {
      id: "sucursal",
      path: "/sucursales",
      title: "Sucursales",
      Icon: BusinessIcon,
      roles: ['max', 'supermax'],
      required: permisos.puedeCrearSucursales || role === 'supermax'
    }
  ];

  const reporteItems = [
    {
      id: "reporte",
      path: "/reporte",
      title: "Reporte",
      Icon: PictureAsPdfIcon,
      roles: ['operario', 'max', 'supermax'],
      required: permisos.puedeCrearAuditorias || role === 'supermax'
    }
  ];

  const adminItems = [
    {
      id: "usuarios",
      path: "/usuarios",
      title: "Usuarios",
      Icon: BadgeOutlinedIcon,
      roles: ['max', 'supermax'],
      required: permisos.puedeGestionarUsuarios || role === 'supermax'
    }
  ];

  const developerItems = [
    {
      id: "logs",
      path: "/usuarios/logs",
      title: "Logs del Sistema",
      Icon: AnalyticsIcon,
      roles: ['supermax'],
      required: permisos.puedeVerLogs || role === 'supermax'
    },
    {
      id: "configuracion",
      path: "/configuracion",
      title: "Configuración",
      Icon: SettingsIcon,
      roles: ['supermax'],
      required: permisos.puedeGestionarSistema || role === 'supermax'
    }
  ];

  const perfilItems = [
    {
      id: "perfil",
      path: "/perfil",
      title: "Mi Perfil",
      Icon: PersonIcon,
      roles: ['operario', 'max', 'supermax'],
      required: true
    }
  ];

  // Combinar todos los items
  const allItems = [
    ...baseItems,
    ...auditoriaItems,
    ...formularioItems,
    ...empresaItems,
    ...reporteItems,
    ...adminItems,
    ...developerItems,
    ...perfilItems
  ];

  // Filtrar items según rol y permisos
  return allItems.filter(item => {
    // Verificar si el rol tiene acceso
    const hasRoleAccess = item.roles.includes(role);
    
    // Verificar si cumple con los requisitos de permisos
    const hasPermissionAccess = item.required === true || item.required;
    
    return hasRoleAccess && hasPermissionAccess;
  });
};

// Menú por defecto (para compatibilidad)
export const menuItems = [
    {
        id: "dashboard",
        path: "/dashboard",
        title: "Panel de Control",
        Icon: HomeIcon
    },
    {
        id: "home",
        path: "/",
        title: "Inicio",
        Icon: HomeIcon
    },
    {
        id: "auditoria",
        path: "/auditoria",
        title: "Auditoría",
        Icon: ChecklistIcon
    },
    {
        id: "formularios",
        path: "/formulario",
        title: "Formularios",
        Icon: FormatListBulletedOutlinedIcon
    },
    {
        id: "editar-formulario",
        path: "/editar",
        title: "Editar Formulario",
        Icon: FormatListBulletedOutlinedIcon
    },
    {
        id: "establecimiento",
        path: "/establecimiento",
        title: "Establecimientos",
        Icon: BusinessIcon
    },
    {
        id: "sucursal",
        path: "/sucursales",
        title: "Sucursales",
        Icon: BusinessIcon
    },
    {
        id: "reporte",
        path: "/reporte",
        title: "Reporte",
        Icon: PictureAsPdfIcon
    },
    {
        id: "usuarios",
        path: "/usuarios",
        title: "Usuarios",
        Icon: BadgeOutlinedIcon
    },
    {
        id: "perfil",
        path: "/perfil",
        title: "Mi Perfil",
        Icon: PersonIcon
    }
];
