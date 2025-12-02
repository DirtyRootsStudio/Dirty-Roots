"use client";  
  
import Link from "next/link";  
import { usePathname } from "next/navigation";  
import ProtectedRoute from "@/src/components/ProtectedRoute";  
  
const navItems = [  
  { path: '/community-admin/questions', icon: '💬', label: 'Questions' },  
  { path: '/community-admin/posts', icon: '🌿', label: 'Posts & Comments' },  
  { path: '/community-admin/users', icon: '👥', label: 'Users' },  
];  
  
function CommunityAdminLayout({ children }: { children: React.ReactNode }) {  
  const pathname = usePathname();  
    
  // Determinar la ruta activa basada en el pathname actual  
  const getActivePath = () => {  
    if (pathname?.startsWith('/community-admin/questions')) {  
      return '/community-admin/questions';  
    }  
    if (pathname?.startsWith('/community-admin/posts')) {  
      return '/community-admin/posts';  
    }  
    if (pathname?.startsWith('/community-admin/users')) {  
      return '/community-admin/users';  
    }  
    return '/community-admin/questions';  
  };  
    
  const activePath = getActivePath();  
  
  return (  
    <div style={{ minHeight: '100vh', background: '#0B0B0B', display: 'flex' }}>  
      {/* Sidebar */}  
      <div style={{  
        width: '250px',  
        background: '#0F0F0F',  
        borderRight: '1px solid #242424',  
        padding: '24px 16px',  
        display: 'flex',  
        flexDirection: 'column'  
      }}>  
        <h2 style={{  
          fontSize: '20px',  
          fontWeight: 'bold',  
          color: '#F5F5F5',  
          marginBottom: '32px'  
        }}>  
          🛠️ Community Admin  
        </h2>  
          
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>  
          {navItems.map(item => (  
            <Link  
              key={item.path}  
              href={item.path}  
              style={{  
                display: 'flex',  
                alignItems: 'center',  
                gap: '12px',  
                padding: '12px 16px',  
                borderRadius: '12px',  
                textDecoration: 'none',  
                color: activePath === item.path ? '#0B0B0B' : '#B6B9BF',  
                background: activePath === item.path ? '#A4CB3E' : 'transparent',  
                transition: 'all 0.2s',  
                border: activePath === item.path ? '1px solid #A4CB3E' : '1px solid transparent'  
              }}  
            >  
              <span style={{ fontSize: '18px' }}>{item.icon}</span>  
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</span>  
            </Link>  
          ))}  
        </nav>  
          
        <div style={{ marginTop: 'auto' }}>  
          <Link  
            href="/"  
            style={{  
              display: 'flex',  
              alignItems: 'center',  
              gap: '12px',  
              padding: '12px 16px',  
              borderRadius: '12px',  
              textDecoration: 'none',  
              color: '#757575',  
              transition: 'all 0.2s'  
            }}  
          >  
            <span>←</span>  
            <span style={{ fontSize: '14px' }}>Back to Console</span>  
          </Link>  
        </div>  
      </div>  
  
      {/* Main Content */}  
      <div style={{ flex: 1, overflow: 'auto' }}>  
        {children}  
      </div>  
    </div>  
  );  
}  
  
export default function ProtectedCommunityAdminLayout({ children }: { children: React.ReactNode }) {  
  return (  
    <ProtectedRoute>  
      <CommunityAdminLayout>{children}</CommunityAdminLayout>  
    </ProtectedRoute>  
  );  
}