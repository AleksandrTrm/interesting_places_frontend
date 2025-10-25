// src/pages/user/MyPlaces.tsx
import { useState, useEffect, useRef } from "react";
import { PlacesService } from "../../api/places";
import type { Place } from "../../models/Place";
import { ToastContainer, toast } from "react-toastify"; // Добавим toast для уведомлений

const ELEMENTS_PER_PAGE = 9;

export enum PlaceStatus {
  OnModeration = 0,
  Rejected = 1,
  Approved = 2,
}

interface PlaceWithStatus extends Omit<Place, "placeStatus"> {
  placeStatus: PlaceStatus;
}

export function MyPlaces() {
  const [places, setPlaces] = useState<PlaceWithStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Состояния для модального окна смены фото
  const [isChangePhotoModalOpen, setIsChangePhotoModalOpen] =
    useState<boolean>(false);
  const [selectedPlaceForPhotoChange, setSelectedPlaceForPhotoChange] =
    useState<PlaceWithStatus | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [isPhotoSubmitting, setIsPhotoSubmitting] = useState<boolean>(false);
  const [photoFormError, setPhotoFormError] = useState<string | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await PlacesService.getMyPlaces(page, ELEMENTS_PER_PAGE);
      const responseData = response.data;

      setPlaces(responseData.values);
      setTotalElements(responseData.totalCount);

      const calculatedTotalPages = Math.ceil(
        responseData.totalCount / ELEMENTS_PER_PAGE
      );
      setTotalPages(calculatedTotalPages);
    } catch (err) {
      console.error("Ошибка при загрузке моих мест:", err);
      setError("Не удалось загрузить список ваших мест.");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (!loading) {
      const scrollToTop = () => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      };

      const firstRAF = requestAnimationFrame(() => {
        requestAnimationFrame(scrollToTop);
      });

      return () => {
        cancelAnimationFrame(firstRAF);
      };
    }
  }, [currentPage, loading]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getStatusInfo = (status: PlaceStatus) => {
    switch (status) {
      case PlaceStatus.Approved:
        return { text: "Одобрено", color: "is-success" };
      case PlaceStatus.Rejected:
        return { text: "Отклонено", color: "is-danger" };
      case PlaceStatus.OnModeration:
      default:
        return { text: "На модерации", color: "is-warning" };
    }
  };

  // --- Функции для смены фото ---
  const openChangePhotoModal = (place: PlaceWithStatus) => {
    if (place.placeStatus === PlaceStatus.Approved) {
      // Проверяем статус
      setSelectedPlaceForPhotoChange(place);
      setNewPhotoFile(null);
      setPhotoFormError(null);
      setIsChangePhotoModalOpen(true);
      if (photoFileInputRef.current) {
        photoFileInputRef.current.value = ""; // Сбросим инпут файла
      }
    } else {
      // Если статус не Approved, можно показать сообщение
      toast.info("Изменение фото возможно только для одобренных мест.");
    }
  };

  const closeChangePhotoModal = () => {
    setIsChangePhotoModalOpen(false);
    setSelectedPlaceForPhotoChange(null);
    setNewPhotoFile(null);
    setPhotoFormError(null);
    if (photoFileInputRef.current) {
      photoFileInputRef.current.value = ""; // Сбросим инпут файла при закрытии
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewPhotoFile(e.target.files[0]);
    }
  };

  const handlePhotoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setNewPhotoFile(file);
      } else {
        setPhotoFormError("Пожалуйста, перетащите изображение.");
      }
    }
  };

  const handlePhotoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleChangePhotoSubmit = async () => {
    if (!selectedPlaceForPhotoChange) {
      setPhotoFormError("Место для изменения фото не выбрано.");
      return;
    }
    if (!newPhotoFile) {
      setPhotoFormError("Пожалуйста, выберите файл для загрузки.");
      return;
    }

    // Клиентская валидация файла
    const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
    if (newPhotoFile.size > maxSizeInBytes) {
      setPhotoFormError("Файл слишком большой (максимум 2MB).");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(newPhotoFile.type)) {
      setPhotoFormError(
        "Неподдерживаемый формат файла. Разрешены: JPG, PNG, GIF."
      );
      return;
    }

    setIsPhotoSubmitting(true);
    setPhotoFormError(null);

    try {
      // Используем новый метод в сервисе для смены фото
      await PlacesService.uploadPlacePhoto(
        selectedPlaceForPhotoChange.id,
        newPhotoFile
      );
      // Успешно загружено, обновляем список мест
      fetchData(currentPage);
      closeChangePhotoModal(); // Закрываем окно
      toast.success("Фото места успешно обновлено.", {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (err: any) {
      console.error("Ошибка при смене фото:", err);
      let errorMessage = "Не удалось изменить фото.";
      if (
        err.response &&
        err.response.data &&
        typeof err.response.data === "string"
      ) {
        errorMessage = err.response.data;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setPhotoFormError(errorMessage);
    } finally {
      setIsPhotoSubmitting(false);
    }
  };
  // --- Конец функций для смены фото ---

  return (
    <div className="container mt-5 mb-5">
      <h1 className="title is-1 has-text-centered mb-6">Мои места</h1>

      {loading && (
        <div className="has-text-centered">
          <progress className="progress is-large is-info" max="100">
            Загрузка...
          </progress>
        </div>
      )}

      {error && (
        <div className="notification is-danger">
          <button className="delete" onClick={() => setError(null)}></button>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="columns is-multiline is-variable is-8">
            {places && places.length > 0 ? (
              places.map((place) => {
                const { text: statusText, color: statusColor } = getStatusInfo(
                  place.placeStatus
                );
                const canChangePhoto =
                  place.placeStatus === PlaceStatus.Approved;

                return (
                  <div
                    key={place.id || place.title}
                    className="column is-one-third-desktop is-half-tablet is-full-mobile"
                  >
                    <div
                      className="card"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      <div className="card-image">
                        <figure className="image is-4by3">
                          <img
                            src={
                              place.photoLink && place.photoLink.trim() !== ""
                                ? place.photoLink
                                : "/public/images/image.png"
                            }
                            alt={place.title}
                            onError={(e) => {
                              const imgElement = e.target as HTMLImageElement;
                              const DEFAULT_IMAGE_PATH =
                                "/public/images/image.png";

                              if (imgElement.src.includes(DEFAULT_IMAGE_PATH)) {
                                console.warn(
                                  `Изображение по умолчанию '${DEFAULT_IMAGE_PATH}' не может быть загружено.`
                                );
                                imgElement.style.border = "1px dashed red";
                                imgElement.alt = "Изображение недоступно";
                                return;
                              }
                              console.warn(
                                `Неожиданная ошибка загрузки изображения для '${place.title}'. Повторная попытка с дефолтным изображением.`
                              );
                              imgElement.src = DEFAULT_IMAGE_PATH;
                              imgElement.style.height = "128px";
                              imgElement.style.width = "128px";
                              imgElement.style.objectFit = "contain";
                              imgElement.style.alignSelf = "center";
                              imgElement.style.justifySelf = "center";
                            }}
                          />
                        </figure>
                      </div>
                      <div
                        className="card-content"
                        style={{
                          flexGrow: 1,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <h2 className="title is-4">{place.title}</h2>
                        <div className="content" style={{ flexGrow: 1 }}>
                          <p>{place.description || "Описание отсутствует"}</p>
                          <p className={`mt-2 tag ${statusColor}`}>
                            {statusText}
                          </p>
                        </div>
                      </div>
                      {/* Кнопка "Изменить фото" появляется только для одобренных мест */}
                      {canChangePhoto && (
                        <div className="card-footer">
                          <button
                            className="card-footer-item button is-info is-small"
                            onClick={() => openChangePhotoModal(place)}
                          >
                            Изменить фото
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="column is-full">
                <p className="has-text-centered">
                  Вы не предложили ни одного места.
                </p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <nav
              className="pagination is-centered mt-6"
              role="navigation"
              aria-label="pagination"
            >
              <button
                className="pagination-previous"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
              >
                Назад
              </button>
              <button
                className="pagination-next"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
              >
                Вперёд
              </button>

              <ul className="pagination-list">
                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter(
                    (pageNumber) =>
                      pageNumber === 0 ||
                      pageNumber === totalPages - 1 ||
                      (pageNumber >= currentPage - 1 &&
                        pageNumber <= currentPage + 1)
                  )
                  .map((pageNumber, index, filteredPages) => {
                    const showEllipsisBefore =
                      index > 0 && pageNumber > filteredPages[index - 1] + 1;

                    return (
                      <li key={pageNumber}>
                        {showEllipsisBefore && (
                          <span className="pagination-ellipsis">&hellip;</span>
                        )}
                        <button
                          className={`pagination-link ${
                            pageNumber === currentPage ? "is-current" : ""
                          }`}
                          aria-label={`Страница ${pageNumber + 1}`}
                          aria-current={
                            pageNumber === currentPage ? "page" : undefined
                          }
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber + 1}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </nav>
          )}
        </>
      )}

      {/* Модальное окно для смены фото */}
      {isChangePhotoModalOpen && selectedPlaceForPhotoChange && (
        <div className="modal is-active">
          <div
            className="modal-background"
            onClick={closeChangePhotoModal}
          ></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">
                Изменить фото для "{selectedPlaceForPhotoChange.title}"
              </p>
              <button
                className="delete"
                aria-label="close"
                onClick={closeChangePhotoModal}
              ></button>
            </header>
            <section className="modal-card-body">
              {photoFormError && (
                <div className="notification is-danger">
                  <button
                    className="delete"
                    onClick={() => setPhotoFormError(null)}
                  ></button>
                  {photoFormError}
                </div>
              )}

              <div className="field">
                <label className="label">Новое фото *</label>
                <div
                  className="file has-name is-fullwidth"
                  onDrop={handlePhotoDrop}
                  onDragOver={handlePhotoDragOver}
                >
                  <label className="file-label">
                    <input
                      ref={photoFileInputRef}
                      className="file-input"
                      type="file"
                      name="newPhoto"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      disabled={isPhotoSubmitting}
                    />
                    <span className="file-cta">
                      <span className="file-icon">
                        <i className="fas fa-upload"></i>
                      </span>
                      <span className="file-label">
                        Выберите файл или перетащите его сюда...
                      </span>
                    </span>
                    <span className="file-name">
                      {newPhotoFile ? newPhotoFile.name : "Файл не выбран"}
                    </span>
                  </label>
                </div>
              </div>
              {newPhotoFile && (
                <div className="mt-4">
                  <p className="has-text-weight-semibold">
                    Предварительный просмотр:
                  </p>
                  <figure className="image is-128x128">
                    <img
                      src={URL.createObjectURL(newPhotoFile)}
                      alt="Предварительный просмотр нового фото"
                      style={{ objectFit: "cover" }}
                    />
                  </figure>
                </div>
              )}
            </section>
            <footer className="modal-card-foot">
              <div className="field is-grouped is-fullwidth">
                <div className="control">
                  <button
                    className="button is-light"
                    onClick={closeChangePhotoModal}
                    disabled={isPhotoSubmitting}
                  >
                    Отмена
                  </button>
                </div>
                <div className="control">
                  <button
                    className={`button is-primary ${
                      isPhotoSubmitting ? "is-loading" : ""
                    }`}
                    onClick={handleChangePhotoSubmit}
                    disabled={isPhotoSubmitting || !newPhotoFile}
                  >
                    Обновить фото
                  </button>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
