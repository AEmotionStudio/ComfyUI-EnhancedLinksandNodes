/**
 * canonical(): a recorded trace (recording-context.ts) reduced to what it
 * paints. Each fill, stroke, text or image becomes one line with its path and
 * the state that decides how it looks (a fill's rule, a text's letter spacing
 * among it), so two traces compare equal when they
 * paint the same things in the same order, however they set the state up:
 * redundant sets, explicit sets of a value already there, save() and restore()
 * around it and the order of the sets do not show. What paints nothing does
 * not show either: a paint at alpha 0, a path with no points, a shadow without
 * blur or offset. Frame headers stay; the counts after each frame go.
 *
 * A path keeps the transform each of its points was given in, as the calls that
 * made it: `[translate(100, 100) rotate(0)] moveTo(10.8, 0) ...`. A stroke keeps
 * the transform it was stroked in, which scales its width.
 *
 * @module tests/helpers/canonical
 */

const PATH_OPS = new Set('moveTo lineTo bezierCurveTo quadraticCurveTo arc arcTo ellipse rect roundRect closePath'.split(' '));
const TRANSFORMS = new Set('translate rotate scale transform'.split(' '));
const PAINTS = new Set('fill stroke fillRect strokeRect fillText strokeText drawImage clip'.split(' '));
/** Calls that change nothing a paint shows, or that the state above already holds. */
const QUIET = new Set('save restore beginPath setLineDash getLineDash measureText getTransform isPointInPath isPointInStroke'.split(' '));

interface State {
    props: Record<string, string>;
    dash: string;
    transform: string[];
}

const INITIAL: Record<string, string> = {
    fillStyle: '#000000',
    strokeStyle: '#000000',
    globalAlpha: '1',
    lineWidth: '1',
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: '10',
    lineDashOffset: '0',
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowBlur: '0',
    shadowOffsetX: '0',
    shadowOffsetY: '0',
    globalCompositeOperation: 'source-over',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    letterSpacing: '0px',
    filter: 'none',
};

/** A serialized colour's alpha: #rrggbb is 1, rgba(r, g, b, a) is a. */
const alphaOf = (colour: string) => (colour.startsWith('rgba(') ? Number(colour.slice(colour.lastIndexOf(',') + 1, -1)) : 1);

export function canonical(trace: string): string {
    const out: string[] = [];
    let state: State = { props: { ...INITIAL }, dash: '[]', transform: [] };
    const stack: State[] = [];
    let path: string[] = [];
    let pathTransform = '';
    const gradients = new Map<string, { make: string; stops: string[] }>();
    const paths2d = new Map<string, string>();

    const transform = () => state.transform.join(' ');
    const style = (value: string) => {
        const gradient = gradients.get(value);
        return gradient ? `${gradient.make}[${gradient.stops.join(', ')}]` : value;
    };
    const shadow = () => {
        const { shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY } = state.props;
        const seen = alphaOf(shadowColor) > 0 && (Number(shadowBlur) > 0 || Number(shadowOffsetX) !== 0 || Number(shadowOffsetY) !== 0);
        return seen ? `${shadowColor}/${shadowBlur}/${shadowOffsetX}/${shadowOffsetY}` : 'none';
    };

    for (const line of trace.split('\n')) {
        if (!line) continue;
        if (line.startsWith('# ')) {
            if (!line.startsWith('# gradients=')) out.push(line);
            continue;
        }
        if (line.includes(' threw ')) {
            out.push(`THREW ${line}`);
            continue;
        }
        const set = /^(\w+) = (.*)$/.exec(line);
        if (set && !set[1].startsWith('grad') && !set[1].startsWith('path')) {
            if (!set[2].includes(' [ignored') && !set[2].endsWith('[expando]')) state.props[set[1]] = set[2];
            continue;
        }
        const made = /^(grad\d+) = (\w+)\((.*)\)$/.exec(line);
        if (made) {
            gradients.set(made[1], { make: `${made[2].replace(/^create|Gradient$/g, '').toLowerCase()}(${made[3]})`, stops: [] });
            continue;
        }
        const stop = /^(grad\d+)\.addColorStop\((.*)\)$/.exec(line);
        if (stop) {
            gradients.get(stop[1])!.stops.push(stop[2].replace(', ', ' '));
            continue;
        }
        const path2d = /^(path\d+) = Path2D\[(.*)\]$/.exec(line);
        if (path2d) {
            paths2d.set(path2d[1], path2d[2]);
            continue;
        }
        const call = /^(\w+)\((.*)\)( \[ignored\])?$/.exec(line);
        if (!call) {
            out.push(line);
            continue;
        }
        const [, name, args, ignored] = call;
        if (ignored) continue;
        if (name === 'save') stack.push({ props: { ...state.props }, dash: state.dash, transform: [...state.transform] });
        else if (name === 'restore') state = stack.pop()!;
        else if (name === 'beginPath') path = [];
        else if (name === 'setLineDash') state.dash = args;
        else if (TRANSFORMS.has(name)) state.transform.push(`${name}(${args})`);
        else if (name === 'setTransform' || name === 'resetTransform') state.transform = name === 'setTransform' && args ? [`setTransform(${args})`] : [];
        else if (PATH_OPS.has(name)) {
            if (!path.length || transform() !== pathTransform) path.push(`[${(pathTransform = transform())}]`);
            path.push(`${name}(${args})`);
        } else if (PAINTS.has(name)) {
            const p = state.props;
            if (Number(p.globalAlpha) === 0) continue;
            const ofPath2d = paths2d.get(args.split(',')[0]);
            const drawn = name === 'fill' || name === 'stroke' || name === 'clip' ? (ofPath2d ? `Path2D ${ofPath2d}` : path.join(' ')) : args;
            if (!drawn) continue;
            const parts = [name, drawn];
            if (name.startsWith('stroke')) {
                parts.push(`style=${style(p.strokeStyle)}`, `width=${p.lineWidth}`, `cap=${p.lineCap}`, `join=${p.lineJoin}`);
                if (p.lineJoin === 'miter') parts.push(`miter=${p.miterLimit}`);
                if (state.dash !== '[]') parts.push(`dash=${state.dash}`, `offset=${p.lineDashOffset}`);
            } else if (name !== 'drawImage' && name !== 'clip') parts.push(`style=${style(p.fillStyle)}`);
            if (name.endsWith('Text')) parts.push(`font=${p.font}`, `align=${p.textAlign}`, `baseline=${p.textBaseline}`, ...(p.letterSpacing === '0px' ? [] : [`spacing=${p.letterSpacing}`]));
            if ((name === 'fill' || name === 'clip') && args.includes('"evenodd"')) parts.push('rule=evenodd');
            if (name !== 'clip') parts.push(`alpha=${p.globalAlpha}`, `shadow=${shadow()}`);
            if (p.globalCompositeOperation !== 'source-over') parts.push(`composite=${p.globalCompositeOperation}`);
            if (p.filter !== 'none') parts.push(`filter=${p.filter}`);
            // A fill's points took their transform as they were made; a gradient, a stroke's width and text take the one painted in.
            if (state.transform.length && (name !== 'fill' || gradients.has(p.fillStyle))) parts.push(`@[${transform()}]`);
            out.push(parts.join(' '));
        } else if (!QUIET.has(name)) out.push(line);
    }
    return `${out.join('\n')}\n`;
}
