// src/pages/authentication/Authentication.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { AccountService } from "../../api/accounts";

type LoginFields = {
  email: string;
  password: string;
};

type RegisterFields = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function Authentication() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login: contextLogin, accessToken } = useAuth();

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
    reset: resetLogin,
  } = useForm<LoginFields>();

  const {
    register: registerRegister,
    handleSubmit: handleSubmitRegister,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
    reset: resetRegister,
    watch: watchRegister,
  } = useForm<RegisterFields>();

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setGeneralError(null);
    resetLogin();
    resetRegister();
  };

  const onLoginSubmit = async (data: LoginFields) => {
    setGeneralError(null);
    try {
      const userRole = await contextLogin(data.email, data.password);

      navigate("/");
    } catch (err: any) {
      console.error("Login error:", err);
      let errorMessage = "Ошибка входа.";

      if (err && err.response) {
        const responseData = err.response.data;
        const responseStatus = err.response.status;

        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else if (
          typeof responseData === "object" &&
          responseData !== null &&
          "message" in responseData &&
          typeof (responseData as { message?: string }).message === "string" &&
          (responseData as { message?: string }).message
        ) {
          errorMessage = (responseData as { message: string }).message;
        } else {
          console.warn(
            "Unexpected error response format or missing message:",
            responseData
          );
          errorMessage = `Ошибка сервера: ${
            responseStatus || "Unknown Status"
          }`;
        }
      } else if (err && err.request) {
        console.error("Network error or no response received:", err.request);
        errorMessage =
          "Ошибка сети. Проверьте подключение к интернету или попробуйте позже.";
      } else if (err && typeof err.message === "string") {
        errorMessage = err.message;
      } else {
        errorMessage = `Неизвестная ошибка: ${String(err)}`;
      }

      setGeneralError(errorMessage);
    }
  };

  const onRegisterSubmit = async (data: RegisterFields) => {
    setGeneralError(null);
    if (data.password !== data.confirmPassword) {
      setGeneralError("Пароли не совпадают.");
      return;
    }

    try {
      await AccountService.register(data.username, data.email, data.password);
      await contextLogin(data.email, data.password);
      navigate("/");
    } catch (err: any) {
      console.error("Registration error:", err);
      let errorMessage = "Ошибка регистрации.";

      if (err && err.response) {
        const responseData = err.response.data;
        const responseStatus = err.response.status;

        if (typeof responseData === "string" && responseData.trim() !== "") {
          errorMessage = responseData;
        } else if (
          typeof responseData === "object" &&
          responseData !== null &&
          "message" in responseData &&
          typeof (responseData as { message?: string }).message === "string" &&
          (responseData as { message?: string }).message &&
          (responseData as { message?: string }).message!.trim() !== ""
        ) {
          errorMessage = (responseData as { message: string }).message;
        } else {
          console.warn(
            "Unexpected error response format or missing message:",
            responseData
          );
          if (responseStatus === 409) {
            errorMessage =
              "Пользователь с таким email или именем уже существует.";
          } else {
            errorMessage = `Ошибка сервера: ${
              responseStatus || "Unknown Status"
            }`;
          }
        }
      } else if (err && err.request) {
        console.error("Network error or no response received:", err.request);
        errorMessage =
          "Ошибка сети. Проверьте подключение к интернету или попробуйте позже.";
      } else if (err && typeof err.message === "string") {
        errorMessage = err.message;
      } else {
        errorMessage = `Неизвестная ошибка: ${String(err)}`;
      }

      setGeneralError(errorMessage);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100%",
        padding: "1rem",
        backgroundColor: "#f5f5f5",
      }}
    >
      <form
        className="box"
        style={{
          width: "100%",
          maxWidth: "400px",
        }}
        onSubmit={
          isLoginView
            ? handleSubmitLogin(onLoginSubmit)
            : handleSubmitRegister(onRegisterSubmit)
        }
      >
        <h1 className="title is-4 has-text-centered">
          {isLoginView ? "Вход" : "Регистрация"}
        </h1>

        {generalError && (
          <div className="notification is-danger">{generalError}</div>
        )}

        {isLoginView ? (
          <>
            <div className="field">
              <label className="label">Email</label>
              <div className="control">
                <input
                  className={`input ${loginErrors.email ? "is-danger" : ""}`}
                  type="email"
                  placeholder="e.g. alex@example.com"
                  disabled={isLoginSubmitting}
                  {...registerLogin("email", {
                    required: "Это поле обязательно",
                    pattern: {
                      value:
                        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                      message: "Введите корректный email",
                    },
                  })}
                />
              </div>
              {loginErrors.email && (
                <p className="help is-danger">{loginErrors.email.message}</p>
              )}
            </div>

            <div className="field">
              <label className="label">Password</label>
              <div className="control">
                <input
                  className={`input ${loginErrors.password ? "is-danger" : ""}`}
                  type="password"
                  placeholder="********"
                  disabled={isLoginSubmitting}
                  {...registerLogin("password", {
                    required: "Это поле обязательно",
                  })}
                />
              </div>
              {loginErrors.password && (
                <p className="help is-danger">{loginErrors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              className={`button is-primary is-fullwidth ${
                isLoginSubmitting ? "is-loading" : ""
              }`}
              disabled={isLoginSubmitting}
            >
              Войти
            </button>

            <div
              className="mt-3"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span>Нет аккаунта? </span>
                <button
                  type="button"
                  className="button is-text ml-1"
                  onClick={toggleView}
                  disabled={isLoginSubmitting}
                >
                  Зарегистрироваться
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label className="label">Имя пользователя</label>
              <div className="control">
                <input
                  className={`input ${
                    registerErrors.username ? "is-danger" : ""
                  }`}
                  type="text"
                  placeholder="e.g. alex_chel"
                  disabled={isRegisterSubmitting}
                  {...registerRegister("username", {
                    required: "Это поле обязательно",
                  })}
                />
              </div>
              {registerErrors.username && (
                <p className="help is-danger">
                  {registerErrors.username.message}
                </p>
              )}
            </div>

            <div className="field">
              <label className="label">Email</label>
              <div className="control">
                <input
                  className={`input ${registerErrors.email ? "is-danger" : ""}`}
                  type="email"
                  placeholder="e.g. alex@example.com"
                  disabled={isRegisterSubmitting}
                  {...registerRegister("email", {
                    required: "Это поле обязательно",
                    pattern: {
                      value:
                        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                      message: "Введите корректный email",
                    },
                  })}
                />
              </div>
              {registerErrors.email && (
                <p className="help is-danger">{registerErrors.email.message}</p>
              )}
            </div>

            <div className="field">
              <label className="label">Пароль</label>
              <div className="control">
                <input
                  className={`input ${
                    registerErrors.password ? "is-danger" : ""
                  }`}
                  type="password"
                  placeholder="********"
                  disabled={isRegisterSubmitting}
                  {...registerRegister("password", {
                    required: "Это поле обязательно",
                  })}
                />
              </div>
              {registerErrors.password && (
                <p className="help is-danger">
                  {registerErrors.password.message}
                </p>
              )}
            </div>

            <div className="field">
              <label className="label">Подтверждение пароля</label>
              <div className="control">
                <input
                  className={`input ${
                    registerErrors.confirmPassword ||
                    (watchRegister("confirmPassword") !==
                      watchRegister("password") &&
                      watchRegister("password") &&
                      watchRegister("confirmPassword"))
                      ? "is-danger"
                      : ""
                  }`}
                  type="password"
                  placeholder="********"
                  disabled={isRegisterSubmitting}
                  {...registerRegister("confirmPassword", {
                    required: "Подтвердите пароль",
                  })}
                />
              </div>
              {registerErrors.confirmPassword && (
                <p className="help is-danger">
                  {registerErrors.confirmPassword.message}
                </p>
              )}
              {!registerErrors.confirmPassword &&
                watchRegister("confirmPassword") !==
                  watchRegister("password") &&
                watchRegister("password") &&
                watchRegister("confirmPassword") && (
                  <p className="help is-danger">Пароли не совпадают</p>
                )}
            </div>

            <button
              type="submit"
              className={`button is-primary is-fullwidth ${
                isRegisterSubmitting ? "is-loading" : ""
              }`}
              disabled={isRegisterSubmitting}
            >
              Зарегистрироваться
            </button>

            <div
              className="mt-3"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span>Уже есть аккаунт? </span>
                <button
                  type="button"
                  className="button is-text ml-1"
                  onClick={toggleView}
                  disabled={isRegisterSubmitting}
                >
                  Войти
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
