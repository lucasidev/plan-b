using System.Data.Common;

namespace Planb.SharedKernel.Abstractions.Persistence;

/// <summary>
/// Abre conexiones para las lecturas Dapper. Existe para que los servicios de lectura no repitan
/// la plomería: antes cada uno recibía <c>IConfiguration</c>, sacaba el connection string y lo
/// validaba en su constructor, dieciséis veces con el mismo texto.
///
/// <para>
/// Devuelve <see cref="DbConnection"/> y no <c>IDbConnection</c> a propósito: Dapper solo abre la
/// conexión de forma asincrónica cuando el tipo concreto lo permite, y con la interfaz de
/// <c>System.Data</c> cae al camino sincrónico.
/// </para>
///
/// <para>
/// Vive en el shared kernel porque la usan los tres módulos, y su firma toca solo el BCL: la
/// implementación con Npgsql vive en el host, así que ningún módulo (ni el dominio, que referencia
/// este proyecto) hereda una dependencia al driver.
/// </para>
/// </summary>
public interface IDbConnectionFactory
{
    /// <summary>
    /// Una conexión nueva y sin abrir. El caller la dispone; Dapper la abre cuando la usa.
    /// </summary>
    DbConnection Create();
}
