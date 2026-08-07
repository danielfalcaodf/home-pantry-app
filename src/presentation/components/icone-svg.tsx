import Svg, { Path } from 'react-native-svg';

export type IconeSvgProps = {
  /** Um `d` só (o padrão do design system: vários subpaths via múltiplos
   *  comandos `M` numa string) ou vários `d`s separados, quando o ícone
   *  precisa de traços com atributos distintos entre si. */
  path: string | readonly string[];
  cor: string;
  tamanho?: number;
};

export function IconeSvg({ path, cor, tamanho = 24 }: IconeSvgProps) {
  const paths = typeof path === 'string' ? [path] : path;
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      {paths.map((d, indice) => (
        <Path
          key={indice}
          d={d}
          stroke={cor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
