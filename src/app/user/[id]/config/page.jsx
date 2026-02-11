



export default function ConfigPage({ params }) {
  const { id } = params; // El nombre coincide con el nombre de la carpeta [id]

    return (
        <div>
            <h1>Configuración del usuario: {id}</h1>
        </div>
    );
}