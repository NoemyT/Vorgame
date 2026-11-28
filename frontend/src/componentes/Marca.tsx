import { Link } from 'react-router';

export function Marca() {
  return (
    <Link className="marca-vorgame" to="/" aria-label="Vorgame, início">
      <img alt="" height={34} src="/midia/vorgame-marca.png" width={34} />
      <span>Vorgame</span>
    </Link>
  );
}
