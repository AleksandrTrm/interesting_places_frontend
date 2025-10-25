// src/pages/places/PlacesPage.tsx
import { useState, useEffect, useRef } from "react";
import { PlacesService } from "../../api/places";
import type { Place } from "../../models/Place";
import { api } from "../../api/api";
import { toast, ToastContainer } from "react-toastify";

const ELEMENTS_PER_PAGE = 9;

export function Places() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Состояния для модального окна
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalStep, setModalStep] = useState<number>(1);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdPlaceId, setCreatedPlaceId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await PlacesService.getPlaces(page, ELEMENTS_PER_PAGE);
      const responseData = response.data;

      setPlaces(responseData.values);
      setTotalElements(responseData.totalCount);

      const calculatedTotalPages = Math.ceil(
        responseData.totalCount / ELEMENTS_PER_PAGE
      );
      setTotalPages(calculatedTotalPages);
    } catch (err) {
      console.error("Ошибка при загрузке мест:", err);
      setError("Не удалось загрузить список интересных мест.");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  // Улучшенная плавная прокрутка вверх
  useEffect(() => {
    if (!loading) {
      // Используем requestAnimationFrame для лучшей синхронизации с рендерингом
      const scrollToTop = () => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      };

      // Первый RAF для начала после рендера
      const firstRAF = requestAnimationFrame(() => {
        // Второй RAF для гарантии выполнения после layout
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

  // Функции для работы с модальным окном
  const openModal = () => {
    setIsModalOpen(true);
    setModalStep(1);
    setTitle("");
    setDescription("");
    setSelectedFile(null);
    setFormError(null);
    setCreatedPlaceId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError(null);
  };

  const handleCreatePlace = async () => {
    if (!title.trim() || !description.trim()) {
      setFormError("Название и описание обязательны.");
      return;
    }
    if (title.length < 3) {
      setFormError("Название слишком короткое (минимум 3 символа).");
      return;
    }
    if (title.length > 20) {
      setFormError("Название слишком длинное (максимум 20 символов).");
      return;
    }
    if (description.length > 500) {
      setFormError("Описание слишком длинное (максимум 500 символов).");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const response = await PlacesService.createPlace(title, description);
      console.log(response);
      const newPlaceId = response.data;
      if (newPlaceId) {
        setCreatedPlaceId(newPlaceId);
        setModalStep(2);
      } else {
        setFormError("Не удалось получить ID созданного места.");
      }
    } catch (err: any) {
      console.error("Ошибка при создании места:", err);
      let errorMessage = "Не удалось создать место.";
      if (
        err.response &&
        err.response.data &&
        typeof err.response.data === "string"
      ) {
        errorMessage = err.response.data;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!createdPlaceId) {
      setFormError("Нет созданного места для загрузки фото.");
      return;
    }
    if (!selectedFile) {
      setFormError("Пожалуйста, выберите файл для загрузки.");
      return;
    }

    // Клиентская валидация файла
    const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
    if (selectedFile.size > maxSizeInBytes) {
      setFormError("Файл слишком большой (максимум 2MB).");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setFormError("Неподдерживаемый формат файла. Разрешены: JPG, PNG, GIF.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      // Используем метод из сервиса
      await PlacesService.uploadPlacePhoto(createdPlaceId, selectedFile);
      // Успешно загружено, обновляем список мест и закрываем окно
      fetchData(currentPage); // Перезагружаем текущую страницу
      closeModal();

      toast.success(
        "Ваше место будет просмотрено модераторами перед тем как вы сможете увидеть его в поиске.",
        {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } catch (err: any) {
      console.error("Ошибка при загрузке фото:", err);
      let errorMessage = "Не удалось загрузить фото.";
      if (
        err.response &&
        err.response.data &&
        typeof err.response.data === "string"
      ) {
        errorMessage = err.response.data;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
      } else {
        setFormError("Пожалуйста, перетащите изображение.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="container mt-5 mb-5">
      <h1 className="title is-1 has-text-centered mb-6">
        Интересные места Челябинска
      </h1>

      {/* Кнопка для открытия модального окна */}
      <div className="has-text-centered mb-6">
        <button className="button is-primary is-medium" onClick={openModal}>
          Предложить место
        </button>
      </div>

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
              places.map((place) => (
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
                              : "/public/images/image.png" // Прямой путь к дефолтному изображению
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
                        <p>
                          <strong>Автор:</strong>{" "}
                          {place.author?.username || "Неизвестный автор"}
                        </p>
                        <p>{place.description || "Описание отсутствует"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="column is-full">
                <p className="has-text-centered">Места не найдены.</p>
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

      {/* Модальное окно */}
      {isModalOpen && (
        <div className="modal is-active">
          <div className="modal-background" onClick={closeModal}></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">
                {modalStep === 1 ? "Добавить место" : "Загрузить фото"}
              </p>
              <button
                className="delete"
                aria-label="close"
                onClick={closeModal}
              ></button>
            </header>
            <section className="modal-card-body">
              {formError && (
                <div className="notification is-danger">
                  <button
                    className="delete"
                    onClick={() => setFormError(null)}
                  ></button>
                  {formError}
                </div>
              )}

              {modalStep === 1 ? (
                // Шаг 1: Ввод данных
                <div>
                  <div className="field">
                    <label className="label">Название *</label>
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Введите название места"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Описание *</label>
                    <div className="control">
                      <textarea
                        className="textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Введите описание места"
                        disabled={isSubmitting}
                        rows={4}
                      ></textarea>
                    </div>
                  </div>
                </div>
              ) : (
                // Шаг 2: Загрузка фото
                <div>
                  <div className="field">
                    <label className="label">Фото *</label>
                    <div
                      className="file has-name is-fullwidth"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      <label className="file-label">
                        <input
                          ref={fileInputRef}
                          className="file-input"
                          type="file"
                          name="resume"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={isSubmitting}
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
                          {selectedFile ? selectedFile.name : "Файл не выбран"}
                        </span>
                      </label>
                    </div>
                  </div>
                  {selectedFile && (
                    <div className="mt-4">
                      <p className="has-text-weight-semibold">
                        Предварительный просмотр:
                      </p>
                      <figure className="image is-128x128">
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="Предварительный просмотр загружаемого фото"
                          style={{ objectFit: "cover" }}
                        />
                      </figure>
                    </div>
                  )}
                </div>
              )}
            </section>
            <footer className="modal-card-foot">
              <div className="field is-grouped is-fullwidth">
                <div className="control">
                  <button
                    className="button is-light"
                    onClick={
                      modalStep === 1 ? closeModal : () => setModalStep(1)
                    }
                    disabled={isSubmitting}
                  >
                    {modalStep === 1 ? "Отмена" : "Назад"}
                  </button>
                </div>
                <div className="control">
                  {modalStep === 1 ? (
                    <button
                      className={`button is-primary ${
                        isSubmitting ? "is-loading" : ""
                      }`}
                      onClick={handleCreatePlace}
                      disabled={isSubmitting}
                    >
                      Далее
                    </button>
                  ) : (
                    <button
                      className={`button is-success ${
                        isSubmitting ? "is-loading" : ""
                      }`}
                      onClick={handleUploadPhoto}
                      disabled={isSubmitting}
                    >
                      Загрузить фото
                    </button>
                  )}
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}

      <div className="container mt-5 mb-5">
        <ToastContainer />
      </div>
    </div>
  );
}
