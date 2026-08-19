import { logoutAction } from "@/lib/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button className="button button--ghost" type="submit">
        Cerrar sesión
      </button>
    </form>
  );
}
