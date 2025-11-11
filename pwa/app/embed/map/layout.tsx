// app/embed/map/layout.tsx  
export default function EmbedMapLayout({  
  children,  
}: {  
  children: React.ReactNode;  
}) {  
  return (  
    <html lang="es">  
      <head>  
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />  
      </head>  
      <body style={{ margin: 0, padding: 0, overflow: 'hidden' }}>  
        {children}  
      </body>  
    </html>  
  );  
}