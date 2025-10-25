// src/pages/attractions/AttractionsPage.tsx
import { useState, useEffect, useRef } from "react";
import { AttractionsService } from "../../api/attractions";
import type { Attraction } from "../../models/Attraction";
import { useAuth } from "../../contexts/useAuth"; // Для проверки роли
import { ToastContainer, toast } from "react-toastify";
import { api } from "../../api/api"; // Для загрузки фото

const ELEMENTS_PER_PAGE = 9;

export function Attractions() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Состояния для модального окна добавления
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalStep, setModalStep] = useState<number>(1);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [dateOfBorn, setDateOfBorn] = useState<string>(""); // Дата в формате ISO строка
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdAttractionId, setCreatedAttractionId] = useState<string | null>(
    null
  );

  // --- Состояния для модального окна изменения фото ---
  const [isChangePhotoModalOpen, setIsChangePhotoModalOpen] =
    useState<boolean>(false);
  const [
    selectedAttractionForPhotoChange,
    setSelectedAttractionForPhotoChange,
  ] = useState<Attraction | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [isPhotoSubmitting, setIsPhotoSubmitting] = useState<boolean>(false);
  const [photoFormError, setPhotoFormError] = useState<string | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  // --- Конец состояний для модального окна изменения фото ---

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getUserRole } = useAuth(); // Получаем функцию для проверки роли
  const userRole = getUserRole();
  const isAdmin = userRole === "Admin"; // Сравниваем с вашей строкой роли администратора

  const fetchData = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AttractionsService.getAttractions(
        page,
        ELEMENTS_PER_PAGE
      );
      const responseData = response.data;

      console.log(responseData);

      setAttractions(responseData.values);
      setTotalElements(responseData.totalCount);

      const calculatedTotalPages = Math.ceil(
        responseData.totalCount / ELEMENTS_PER_PAGE
      );
      setTotalPages(calculatedTotalPages);
    } catch (err) {
      console.error("Ошибка при загрузке достопримечательностей:", err);
      setError("Не удалось загрузить список достопримечательностей.");
      setAttractions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

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

  // --- Функции для работы с модальным окном добавления ---
  const openModal = () => {
    setIsModalOpen(true);
    setModalStep(1);
    setTitle("");
    setDescription("");
    setDateOfBorn("");
    setSelectedFile(null);
    setFormError(null);
    setCreatedAttractionId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Сбросим инпут файла
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError(null);
  };

  const handleCreateAttraction = async () => {
    // Валидация на клиенте (можно расширить)
    if (!title.trim() || !dateOfBorn) {
      setFormError("Название и дата основания обязательны.");
      return;
    }
    if (title.length > 100) {
      setFormError("Название не может быть длиннее 100 символов.");
      return;
    }
    if (description.length > 500) {
      setFormError("Описание не может быть длиннее 500 символов.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const response = await AttractionsService.createAttraction({
        title,
        description,
        dateOfBorn: new Date(dateOfBorn).toISOString(), // Преобразуем в ISO строку
      });
      console.log("Ответ от создания достопримечательности:", response);
      // Предполагаем, что бэкенд возвращает ID созданной достопримечательности
      const newAttractionId = response.data; // или response.data.id, в зависимости от ответа
      if (newAttractionId) {
        setCreatedAttractionId(newAttractionId);
        setModalStep(2); // Переход к шагу 2
      } else {
        setFormError("Не удалось получить ID созданной достопримечательности.");
      }
    } catch (err: any) {
      console.error("Ошибка при создании достопримечательности:", err);
      let errorMessage = "Не удалось создать достопримечательность.";
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
    if (!createdAttractionId) {
      setFormError("Нет созданной достопримечательности для загрузки фото.");
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
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      setFormError("Неподдерживаемый формат файла. Разрешены: JPG, PNG, GIF.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // Используем api.put напрямую, как в PlacesPage и FamousPeoplePage
      await api.put(`/files/attractions/${createdAttractionId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // Успешно загружено, обновляем список достопримечательностей и закрываем окно
      fetchData(currentPage); // Перезагружаем текущую страницу
      closeModal();
      toast.success("Достопримечательность успешно добавлена.", {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (err: any) {
      console.error("Ошибка при загрузке фото достопримечательности:", err);
      let errorMessage = "Не удалось загрузить фото достопримечательности.";
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
  // --- Конец функций для модального окна добавления ---

  // --- Функции для работы с модальным окном изменения фото ---
  const openChangePhotoModal = (attraction: Attraction) => {
    setSelectedAttractionForPhotoChange(attraction);
    setNewPhotoFile(null);
    setPhotoFormError(null);
    setIsChangePhotoModalOpen(true);
    if (photoFileInputRef.current) {
      photoFileInputRef.current.value = ""; // Сбросим инпут файла
    }
  };

  const closeChangePhotoModal = () => {
    setIsChangePhotoModalOpen(false);
    setSelectedAttractionForPhotoChange(null);
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
    if (!selectedAttractionForPhotoChange) {
      setPhotoFormError("Достопримечательность для изменения фото не выбрана.");
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
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(newPhotoFile.type)) {
      setPhotoFormError(
        "Неподдерживаемый формат файла. Разрешены: JPG, PNG, GIF, WEBP."
      );
      return;
    }

    setIsPhotoSubmitting(true);
    setPhotoFormError(null);
    const formData = new FormData();
    formData.append("file", newPhotoFile);

    try {
      // Используем api.put напрямую, как в PlacesPage и FamousPeoplePage
      await api.put(
        `/files/attractions/${selectedAttractionForPhotoChange.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // Успешно загружено, обновляем список достопримечательностей
      fetchData(currentPage); // Перезагружаем текущую страницу
      closeChangePhotoModal(); // Закрываем окно
      toast.success("Фото достопримечательности успешно обновлено.", {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (err: any) {
      console.error("Ошибка при смене фото достопримечательности:", err);
      let errorMessage = "Не удалось изменить фото достопримечательности.";
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
  // --- Конец функций для модального окна изменения фото ---

  return (
    <div className="container mt-5 mb-5">
      <h1 className="title is-1 has-text-centered mb-6">
        Достопримечательности Челябинска
      </h1>

      {/* Кнопка "Добавить достопримечательность" для администраторов */}
      {isAdmin && (
        <div className="has-text-centered mb-6">
          <button className="button is-primary is-medium" onClick={openModal}>
            Добавить достопримечательность
          </button>
        </div>
      )}

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
            {attractions && attractions.length > 0 ? (
              attractions.map((attraction) => {
                // --- Получаем роль внутри .map ---
                const currentRole = getUserRole();
                const currentIsAdmin =
                  currentRole === "Admin" || currentRole == "Moderator";
                // --- Конец получения роли ---

                return (
                  <div
                    key={`${attraction.title}-${attraction.dateOfBorn}`} // Уникальный ключ
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
                      {/* --- Блок изображения с кнопкой изменения для админа --- */}
                      <div
                        className="card-image"
                        style={{ position: "relative" }}
                      >
                        <figure className="image is-4by3">
                          <img
                            src={
                              attraction.photoLink &&
                              attraction.photoLink.trim() !== ""
                                ? attraction.photoLink
                                : "/public/images/image.png" // Прямой путь к дефолтному изображению
                            }
                            alt={attraction.title}
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
                                `Неожиданная ошибка загрузки изображения для '${attraction.title}'. Повторная попытка с дефолтным изображением.`
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
                        {/* --- Кнопка "Изменить фото" всегда видна, если админ --- */}
                        {currentIsAdmin && ( // Проверяем роль
                          <div
                            className="card-overlay" // Bulma класс или кастомный CSS
                            style={{
                              position: "absolute",
                              bottom: "10px", // Отступ от нижнего края
                              right: "10px", // Отступ от правого края
                              // Убираем opacity и transition
                            }}
                          >
                            <button
                              className="button is-small is-info"
                              onClick={() => openChangePhotoModal(attraction)} // Открываем модальное окно
                            >
                              Изменить фото
                            </button>
                          </div>
                        )}
                        {/* --- Конец кнопки --- */}
                      </div>
                      {/* --- Конец блока изображения --- */}
                      <div
                        className="card-content"
                        style={{
                          flexGrow: 1,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <h2 className="title is-4">{attraction.title}</h2>
                        <div className="content" style={{ flexGrow: 1 }}>
                          <p>
                            <strong>Год основания/появления:</strong>{" "}
                            {new Date(attraction.dateOfBorn).getFullYear()}
                          </p>
                          <p>
                            {attraction.description || "Описание отсутствует"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="column is-full">
                <p className="has-text-centered">
                  Достопримечательности не найдены.
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

      {/* Модальное окно добавления */}
      {isModalOpen && (
        <div className="modal is-active">
          <div className="modal-background" onClick={closeModal}></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">
                {modalStep === 1
                  ? "Добавить достопримечательность"
                  : "Загрузить фото"}
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
                        placeholder="Введите название достопримечательности"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Описание</label>
                    <div className="control">
                      <textarea
                        className="textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Введите описание достопримечательности"
                        disabled={isSubmitting}
                        rows={4}
                      ></textarea>
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Дата основания/появления *</label>
                    <div className="control">
                      <input
                        className="input"
                        type="date"
                        value={dateOfBorn}
                        onChange={(e) => setDateOfBorn(e.target.value)}
                        disabled={isSubmitting}
                      />
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
                          name="attractionPhoto"
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
                      onClick={handleCreateAttraction}
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

      {/* Модальное окно изменения фото */}
      {isChangePhotoModalOpen && selectedAttractionForPhotoChange && (
        <div className="modal is-active">
          <div
            className="modal-background"
            onClick={closeChangePhotoModal}
          ></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">
                Изменить фото для "{selectedAttractionForPhotoChange.title}"
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
                      name="newAttractionPhoto"
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
