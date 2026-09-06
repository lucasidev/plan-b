using System.Globalization;
using System.Text;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Curation;

/// <summary>
/// El nombre de una persona identificable del catálogo de docentes (ADR-0084): la lista cerrada
/// contra la que se valida que una nota editorial no nombre a nadie.
///
/// <para>
/// Nombrar no es igualdad de texto: <see cref="IsNamedIn"/> encuentra a la persona con solo su
/// apellido ("la cátedra Pérez", "de la Fuente no contesta") o con su nombre y apellido seguidos
/// ("Martín Pérez"), sin acentos y sin distinguir mayúsculas de minúsculas. La mayúscula inicial
/// solo se exige en el camino del apellido solo, sobre su última palabra (así una palabra común
/// que coincide con un apellido, como Campos o Salas, no dispara en minúscula); el camino de
/// nombre y apellido seguidos no tiene esa ambigüedad y no la exige en ninguna palabra.
/// </para>
/// </summary>
public readonly record struct PersonName : IValueObject
{
    public string FirstName { get; }

    public string LastName { get; }

    public PersonName(string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(firstName))
        {
            throw new ArgumentException("FirstName cannot be empty.", nameof(firstName));
        }
        if (string.IsNullOrWhiteSpace(lastName))
        {
            throw new ArgumentException("LastName cannot be empty.", nameof(lastName));
        }

        FirstName = firstName.Trim();
        LastName = lastName.Trim();
    }

    public override string ToString() => $"{FirstName} {LastName}";

    /// <summary>
    /// True si <paramref name="text"/> nombra a esta persona: su apellido solo, o su nombre y
    /// apellido seguidos, como secuencia de palabras enteras.
    /// </summary>
    public bool IsNamedIn(string text)
    {
        if (string.IsNullOrEmpty(text))
        {
            return false;
        }

        var lastNameWords = Tokenize(RemoveDiacritics(LastName));
        if (lastNameWords.Count == 0)
        {
            // Un apellido sin ninguna palabra (ej. "-", ".") no identifica a nadie: sin esta
            // guarda, ContainsAsWholeWords con una lista vacía matchea cualquier texto.
            return false;
        }

        var words = Tokenize(RemoveDiacritics(text));
        return ContainsAsWholeWords(words, lastNameWords, requireUppercaseOnLastWord: true)
            || ContainsAsWholeWords(
                words, Tokenize(RemoveDiacritics(ToString())), requireUppercaseOnLastWord: false);
    }

    private static bool ContainsAsWholeWords(
        IReadOnlyList<string> words,
        IReadOnlyList<string> nameWords,
        bool requireUppercaseOnLastWord)
    {
        for (var start = 0; start + nameWords.Count <= words.Count; start++)
        {
            if (MatchesFrom(words, nameWords, start, requireUppercaseOnLastWord))
            {
                return true;
            }
        }
        return false;
    }

    private static bool MatchesFrom(
        IReadOnlyList<string> words,
        IReadOnlyList<string> nameWords,
        int start,
        bool requireUppercaseOnLastWord)
    {
        var lastOffset = nameWords.Count - 1;
        for (var offset = 0; offset < nameWords.Count; offset++)
        {
            var requireUppercase = requireUppercaseOnLastWord && offset == lastOffset;
            if (!MatchesWord(words[start + offset], nameWords[offset], requireUppercase))
            {
                return false;
            }
        }
        return true;
    }

    // La mayúscula inicial, cuando se exige, va solo en la última palabra de la secuencia buscada,
    // el apellido (así "Perez"/"PÉREZ" cuentan y "perez" no, y un apellido que también es palabra
    // común no dispara en minúscula). El resto de la comparación es case-insensitive; los acentos ya
    // se quitaron antes de tokenizar (ver <see cref="IsNamedIn"/>).
    private static bool MatchesWord(string textWord, string nameWord, bool requireUppercase) =>
        (!requireUppercase || char.IsUpper(textWord[0]))
        && string.Equals(textWord, nameWord, StringComparison.OrdinalIgnoreCase);

    private static string RemoveDiacritics(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var ch in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(ch);
            }
        }
        return builder.ToString();
    }

    // Palabras = secuencias de letras Unicode; cualquier otra cosa separa. Al comparar por palabra
    // entera, "Pereza" nunca matchea "Pérez". Corre siempre después de RemoveDiacritics, así que una
    // marca combinante suelta (texto NFD, ej. "Pe" + "´" + "rez") ya no puede partir una palabra a la
    // mitad.
    private static IReadOnlyList<string> Tokenize(string text)
    {
        var words = new List<string>();
        var start = -1;
        for (var i = 0; i < text.Length; i++)
        {
            if (char.IsLetter(text[i]))
            {
                if (start < 0)
                {
                    start = i;
                }
            }
            else if (start >= 0)
            {
                words.Add(text[start..i]);
                start = -1;
            }
        }
        if (start >= 0)
        {
            words.Add(text[start..]);
        }
        return words;
    }
}
