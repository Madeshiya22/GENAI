import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

function getInitials(name = "", email = "") {
  const source = name || email || "User";
  const parts = source
    .replace(/@.*/, "")
    .split(/\s|\.|_/)
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const SidebarUserMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const displayName = user?.fullname || user?.name || "Mento User";
  const email = user?.email || "";
  const initials = useMemo(() => getInitials(displayName, email), [displayName, email]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="sidebar-user" ref={menuRef}>
      {open && (
        <div className="sidebar-user__menu" role="menu">
          <div className="sidebar-user__menu-header">
            <span className="sidebar-user__menu-avatar">{initials}</span>
            <div>
              <strong>{displayName}</strong>
              {email && <small>{email}</small>}
            </div>
          </div>

          <button
            type="button"
            className="sidebar-user__menu-item sidebar-user__menu-item--danger"
            role="menuitem"
            onClick={onLogout}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}

      <button
        type="button"
        className={`sidebar-user__trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="sidebar-user__avatar" aria-hidden="true">
          {initials || <UserRound size={16} />}
        </span>

        <span className="sidebar-user__identity">
          <span className="sidebar-user__name">{displayName}</span>
          {email && <span className="sidebar-user__email">{email}</span>}
        </span>

        <ChevronDown className="sidebar-user__chevron" size={16} />
      </button>
    </div>
  );
};

export default SidebarUserMenu;
