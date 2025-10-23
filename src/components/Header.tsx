// src/components/Header.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/useAuth";
import { AvatarService } from "../api/avatar";
import { Link } from "react-router-dom";

type AvatarOption = {
  id: number;
  name: string;
  url: string;
};

const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 0,
    name: "Smile",
    url: "/images/avatar/smile.svg",
  },
  {
    id: 1,
    name: "SmileBeam",
    url: "/images/avatar/smile_beam.svg",
  },
  {
    id: 2,
    name: "Grimace",
    url: "/images/avatar/grimace.svg",
  },
  {
    id: 3,
    name: "Flushed",
    url: "/images/avatar/flushed.svg",
  },
];

export function Header() {
  const { user, logout } = useAuth();
  const [localSelectedAvatarId, setLocalSelectedAvatarId] = useState<number>(0);
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);
  const [isSyncedWithUser, setIsSyncedWithUser] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);

  useEffect(() => {
    if (user && user.selectedAvatar !== undefined) {
      const initialIndex = AVATAR_OPTIONS.findIndex(
        (avatar) => avatar.id === user.selectedAvatar
      );
      if (initialIndex !== -1) {
        setLocalSelectedAvatarId((prevId) => {
          if (!isSyncedWithUser || prevId !== user.selectedAvatar) {
            setCurrentAvatarIndex(initialIndex);
            setIsSyncedWithUser(true);
            return user.selectedAvatar;
          }
          return prevId;
        });
      } else {
        console.warn(
          `Avatar ID ${user.selectedAvatar} not found in options. Using default.`
        );
        setLocalSelectedAvatarId((prevId) => {
          if (!isSyncedWithUser || prevId !== 0) {
            setCurrentAvatarIndex(0);
            setIsSyncedWithUser(true);
            return 0;
          }
          return prevId;
        });
      }
    } else {
      setIsSyncedWithUser(false);
    }
  }, [user, isSyncedWithUser]);

  const handleAvatarClick = () => {
    setIsAvatarMenuOpen(!isAvatarMenuOpen);
  };

  const handleAvatarSelect = (avatarId: number) => {
    const newIndex = AVATAR_OPTIONS.findIndex(
      (avatar) => avatar.id === avatarId
    );
    if (newIndex !== -1) {
      setCurrentAvatarIndex(newIndex);
      setLocalSelectedAvatarId(avatarId);
      setIsSyncedWithUser(true);
    }
    setIsAvatarMenuOpen(false);
  };

  const selectedAvatar = AVATAR_OPTIONS.find(
    (avatar) => avatar.id === localSelectedAvatarId
  );

  useEffect(() => {
    if (
      user &&
      user.id &&
      isSyncedWithUser &&
      user.selectedAvatar !== localSelectedAvatarId
    ) {
      const updateAvatarOnServer = async () => {
        try {
          console.log(
            "Sending update request for user:",
            user.id,
            "to avatarId:",
            localSelectedAvatarId
          );
          await AvatarService.changeAvatar(user, localSelectedAvatarId);
          console.log(
            "Avatar updated successfully on server for user:",
            user.id,
            "to avatarId:",
            localSelectedAvatarId
          );
        } catch (error) {
          console.error("Failed to update avatar on server:", error);
        }
      };

      updateAvatarOnServer();
    }
  }, [localSelectedAvatarId, user, isSyncedWithUser]);

  return (
    <nav
      className="navbar"
      role="navigation"
      aria-label="main navigation"
      style={{
        borderBottom: "1px solid #ddd",
      }}
    >
      <style>{`
        .navbar-item-colored {
        }

        .navbar-item-colored:hover {
          color: #00a000 !important;
        }
      `}</style>

      <div className="navbar-brand">
        <img
          src="/images/gerb.png"
          className="image is-48x48"
          style={{ margin: "10px" }}
          alt="Герб"
        />
        <Link className="navbar-item" to="/">
          <h1 className="title is-4">Interesting Places</h1>
        </Link>
      </div>

      <div id="navbarMenu" className="navbar-menu">
        <div className="navbar-start">
          <Link to="/places" className="navbar-item navbar-item-colored">
            Интересные места
          </Link>
          <Link to="/people" className="navbar-item navbar-item-colored">
            Люди
          </Link>
          <Link to="/attractions" className="navbar-item navbar-item-colored">
            Достопримечательности
          </Link>
        </div>

        <div className="navbar-end">
          <div className="navbar-item">
            <div className="buttons">
              {user && (
                <span style={{ fontSize: "20px" }}>
                  {user.userName || user.email}
                </span>
              )}
              {user && selectedAvatar && (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <div
                    onClick={handleAvatarClick}
                    style={{
                      cursor: "pointer",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "1px solid #dbdbdb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={selectedAvatar.url}
                      alt={selectedAvatar.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "fill",
                        display: "block",
                      }}
                    />
                  </div>

                  {isAvatarMenuOpen && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "100%",
                        marginTop: "5px",
                        backgroundColor: "white",
                        border: "1px solid #dbdbdb",
                        borderRadius: "4px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        minWidth: "160px",
                      }}
                    >
                      <div style={{ padding: "8px 12px", fontWeight: "bold" }}>
                        Сменить аватар
                      </div>
                      <hr style={{ margin: "5px 0" }} />
                      {AVATAR_OPTIONS.map((avatar) => (
                        <div
                          key={avatar.id}
                          onClick={() => handleAvatarSelect(avatar.id)}
                          style={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f5f5f5")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor = "")
                          }
                        >
                          <img
                            src={avatar.url}
                            alt={avatar.name}
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              margin: "0px 0px 0px 10px",
                            }}
                          />
                          <span>{avatar.name}</span>
                        </div>
                      ))}
                      <hr style={{ margin: "5px 0" }} />
                      <div
                        onClick={() => {
                          logout();
                          setIsAvatarMenuOpen(false);
                        }}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.backgroundColor = "#f5f5f5")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.backgroundColor = "")
                        }
                      >
                        Выйти
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
