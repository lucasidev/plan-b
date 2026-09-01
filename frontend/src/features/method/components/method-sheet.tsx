import type { CurrentInstrument, InstrumentItem, ItemLayer } from '@/components/instrument/types';

/**
 * Método (SC-021, US-130). Cómo se calcula cada número que el producto publica.
 *
 * La tesis promete un dato que aguanta una discusión, y un conteo sin método publicado no aguanta
 * nada: es "confiá en mí". Esta pantalla existe para que cualquiera pueda rastrear un número hasta
 * la regla que lo calculó **sin leer código**, y para que pueda descartarlo con fundamento.
 *
 * El catálogo de ítems sale del mismo endpoint que usa la pantalla de reseñar: publicar una copia
 * escrita a mano garantizaría que un día diga algo distinto de lo que se pregunta.
 */
export function MethodSheet({
  instrument,
  chairFloor,
  pairFloor,
}: {
  instrument: CurrentInstrument | null;
  chairFloor: number | null;
  pairFloor: number | null;
}) {
  return (
    <div data-surface="bulletin" className="min-h-full w-full">
      <div className="mx-auto w-full max-w-[640px] px-4 py-8">
        <header className="mb-6">
          <p className="font-mono text-[11px] tracking-[0.04em] text-ink-3">Método</p>
          <h1 className="mt-1.5 font-serif text-[26px] font-semibold leading-tight text-ink">
            Cómo se calcula lo que publicamos.
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
            Cada número de una ficha sale de una regla escrita acá. Si después de leer esto pensás
            que un dato no se sostiene, tenés con qué discutirlo.
          </p>
        </header>

        <Block title="De dónde sale una voz">
          <P>
            Una voz es una persona hablando de <b>una cursada</b>: una materia, un período y la
            cátedra con la que la hizo. Se suma a esa cátedra. La materia, la carrera y la
            institución no se preguntan por separado: se arman sumando lo de las cátedras y las
            cursadas que les pertenecen.
          </P>
          <P>
            Nadie responde dos veces la misma cursada. Corregir una reseña reemplaza lo anterior, y
            borrarla la saca de todos los conteos donde sumó.
          </P>
        </Block>

        <Block title="Cómo se arma un conteo">
          <P>
            De cada pregunta se publican dos cosas. La <b>más elegida</b>, con su etiqueta tal como
            está escrita en el cuestionario y su porcentaje, y la <b>distribución completa</b>,
            opción por opción, con los ceros incluidos: que nadie haya elegido una opción es
            información, no una fila para omitir.
          </P>
          <P>
            <b>Nada se promedia.</b> Un promedio junta respuestas que no son números y produce una
            cifra que nadie puede volver a armar. Por eso no vas a ver "2,4 sobre 3" en ninguna
            parte, ni un puntaje, ni un ranking.
          </P>
          <P>
            Cuando varias preguntas distintas apuntan al mismo lado, la ficha lo dice arriba, con
            las preguntas a la vista: la afirmación tiene que poder verificarse sin bajar al
            detalle.
          </P>
        </Block>

        <FloorBlock chairFloor={chairFloor} pairFloor={pairFloor} />

        <Block title="Cuándo decimos que una cátedra es distinta de otra">
          <P>
            Una cátedra solo se compara contra las otras de <b>su misma materia</b>. Ahí el sesgo de
            quién reseña pega parejo, y la diferencia que quede es de la cátedra y no de la materia.
          </P>
          <P>
            La diferencia se publica <b>solo si no puede explicarse por el tamaño de la muestra</b>.
            Para eso se calcula, sobre cada proporción, un intervalo de Wilson, que depende de la
            proporción observada, de cuántas respuestas la sostienen y de un factor de confianza
            fijo. Si los intervalos de las dos cátedras se tocan, no se publica ninguna diferencia.
          </P>
          <P>
            Si la cátedra es <b>la única de su materia</b>, no hay contra qué compararla y no se
            publica ninguna comparación.
          </P>
          <P>
            Ese número nunca se muestra: es la maquinaria que decide si mostrar algo, no un dato.
            Cuando no hay señal suficiente, la ficha se calla en vez de insinuar.
          </P>
        </Block>

        <Block title="Qué sesgos tiene esto">
          <P>
            Todo dato que sale de reseñas es <b>de quienes reseñaron</b>, y quien reseña no es una
            muestra al azar de quien cursó. No lo corregimos con ninguna ponderación: lo decimos.
          </P>
          <P>
            Con qué se llevó una materia sale solo de quien reseñó <b>las dos</b>. La cobertura de
            una carrera dice cuántas de sus materias tienen alguna cátedra publicando: una carrera
            sin reseñas no es impecable, es desconocida, y la ficha lo dice así.
          </P>
          <P>
            Los datos oficiales (cuánto dura una carrera en el papel y en la realidad, cuánto egresa
            por cohorte) <b>no salen de reseñas</b>: se relevan contra fuente pública y se publican
            con <b>la fuente y el período relevado</b> al lado. Un dato oficial sin decir de cuándo
            es no se puede discutir.
          </P>
        </Block>

        <Block title="Lo que no publicamos nunca">
          <P>
            El texto que alguien escribe al final de una reseña <b>no se publica</b>. Lo lee el
            equipo para descubrir qué habría que estar preguntando y no preguntamos.
          </P>
          <P>
            Ninguna reseña se muestra sola, ni con nombre ni sin él. No hay puntajes, ni rankings,
            ni instituciones destacadas o patrocinadas. En ningún lado se afirma una causa: se
            publica qué contestó la gente, no por qué.
          </P>
        </Block>

        <ItemCatalog instrument={instrument} />
      </div>
    </div>
  );
}

/**
 * El bloque que depende de los pisos. Se separa porque es el único de Método que necesita un número
 * del backend, y cuando ese número no llega la pantalla dice que no lo tiene en vez de inventarlo:
 * un piso escrito a mano acá sería una segunda definición de la regla.
 */
function FloorBlock({
  chairFloor,
  pairFloor,
}: {
  chairFloor: number | null;
  pairFloor: number | null;
}) {
  if (chairFloor === null) {
    return (
      <Block title="Por qué una cátedra con pocas reseñas no publica">
        <P>
          Una cátedra no publica sus conteos hasta juntar un mínimo de reseñas. La razón es la
          privacidad de quien reseña, no la estadística: con dos o tres, el titular deduce quién
          dijo qué.
        </P>
        <P>
          La cátedra que no llega <b>no se esconde</b>: se muestra con cuántas juntó y cuántas le
          faltan. Esconderla mentiría sobre lo que hay.
        </P>
        <P>No pudimos leer el mínimo vigente en este momento. Volvé a cargar la página.</P>
      </Block>
    );
  }

  return (
    <Block title={`Por qué una cátedra con ${chairFloor - 1} reseñas no publica`}>
      <P>
        Una cátedra publica sus conteos <b>desde las {chairFloor} reseñas</b>. La razón es la
        privacidad de quien reseña, no la estadística: con dos o tres, el titular deduce quién dijo
        qué.
      </P>
      <P>
        La cátedra que no llega <b>no se esconde</b>: se muestra con cuántas juntó y cuántas le
        faltan. Esconderla mentiría sobre lo que hay.
      </P>
      {pairFloor !== null && (
        <P>
          Con qué otras materias se llevó una tiene su propio piso, de {pairFloor} por par y
          período. Es otro piso porque protege otra cosa: que el número no diga más sobre quién se
          acordó de reseñar que sobre la combinación.
        </P>
      )}
    </Block>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 font-serif text-[18px] font-semibold text-ink">{title}</h2>
      <div className="rounded-xl border border-line bg-bg-card p-4">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-2.5 text-[13px] leading-relaxed text-ink-2 last:mb-0">{children}</p>;
}

const LAYER_LABELS: Record<ItemLayer, string> = {
  Context: 'Contexto de la cursada',
  ChairConduct: 'Qué hizo la cátedra',
  StudentExperience: 'Qué te pasó a vos',
};

const LAYER_NOTES: Record<ItemLayer, string> = {
  Context: 'No se publica. Sirve para leer bien el resto y controlar el sesgo.',
  ChairConduct: 'Conducta observable, en frecuencias que la memoria real puede responder.',
  StudentExperience: 'En primera persona.',
};

const LAYER_ORDER: ItemLayer[] = ['Context', 'ChairConduct', 'StudentExperience'];

/**
 * El cuestionario entero, con sus opciones. Es lo que hace verificable todo lo de arriba: sin ver
 * qué se preguntó exactamente, "el 59 % marcó casi nunca" no se puede auditar.
 */
function ItemCatalog({ instrument }: { instrument: CurrentInstrument | null }) {
  if (!instrument) {
    return (
      <Block title="Qué se pregunta">
        <P>Todavía no hay un cuestionario publicado.</P>
      </Block>
    );
  }

  return (
    <section className="mb-6">
      <h2 className="mb-1 font-serif text-[18px] font-semibold text-ink">Qué se pregunta</h2>
      <p className="mb-2 text-[12px] text-ink-3">
        Las {instrument.items.length} preguntas del cuestionario vigente, con todas sus opciones.
        Salen del mismo lugar del que las lee la pantalla de reseñar.
      </p>
      <p className="mb-2 text-[12px] text-ink-3">
        Las escribimos nosotros para arrancar: son las <b>semilla</b>. Una pregunta que salga de lo
        que muchos escribieron en el campo libre va marcada como <b>destilada</b>. Todavía no hay
        ninguna.
      </p>

      {LAYER_ORDER.map((layer) => {
        const items = instrument.items.filter((i) => i.layer === layer);
        if (items.length === 0) return null;

        return (
          <div key={layer} className="mb-3 rounded-xl border border-line bg-bg-card p-4">
            <p className="text-[13px] font-medium text-ink">{LAYER_LABELS[layer]}</p>
            <p className="mb-3 text-[11.5px] text-ink-3">{LAYER_NOTES[layer]}</p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {items.map((item) => (
                <ItemRow key={item.code} item={item} />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

function ItemRow({ item }: { item: InstrumentItem }) {
  return (
    <li>
      <p className="text-[13px] text-ink">{item.text}</p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-ink-3">
        {item.options.map((o) => o.label).join(' · ')}
      </p>
    </li>
  );
}
