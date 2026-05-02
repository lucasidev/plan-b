namespace Planb.SharedKernel.Primitives;

/// <summary>
/// Marker interface para value objects del dominio. No declara members: la equality structural,
/// inmutabilidad y el constructor con validación los garantiza el patrón <c>readonly record
/// struct</c> + factory <c>Create</c> que se usa en todo el codebase.
///
/// Por qué marker (sin métodos):
/// <list type="bullet">
///   <item>Heredar de una <c>abstract class ValueObject</c> con override manual de
///         Equals/GetHashCode pierde sentido desde C# 9: <c>record</c> y <c>record struct</c>
///         hacen ese trabajo gratis.</item>
///   <item>Pasar de <c>readonly record struct</c> a <c>class</c> sólo para heredar de una base
///         introduce allocations innecesarias en tipos que viajan miles de veces por request
///         (UserId, CareerPlanId, etc.).</item>
/// </list>
///
/// Para qué sirve:
/// <list type="bullet">
///   <item>Documenta intent: declarar <c>: IValueObject</c> dice "esto es un VO del dominio,
///         no un DTO ni un parameter object cualquiera".</item>
///   <item>Discoverability: grep / reflection / tests de arquitectura (NetArchTest) pueden
///         iterar todos los VOs sin convención frágil de naming.</item>
///   <item>Habilita futuras reglas tipo "todos los <c>...Id</c> deben implementar
///         <c>IValueObject</c>" en architecture tests.</item>
/// </list>
///
/// Convenciones esperadas (no enforzadas por compilador):
/// <list type="bullet">
///   <item>Ser <c>readonly record struct</c> (immutable + value semantics built-in).</item>
///   <item>Tener un constructor o factory <c>Create</c> que valide invariantes.</item>
///   <item>Sin estado mutable post-construcción.</item>
/// </list>
/// </summary>
public interface IValueObject;
