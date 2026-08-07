import Svg, { Path } from 'react-native-svg';

export type IconeSvgProps = {
  path: readonly string[];
  cor: string;
  tamanho?: number;
};

export function IconeSvg({ path, cor, tamanho = 24 }: IconeSvgProps) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      {path.map((d, indice) => (
        <Path
          key={indice}
          d={d}
          stroke={cor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
