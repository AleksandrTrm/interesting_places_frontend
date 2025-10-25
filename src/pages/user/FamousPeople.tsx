// src/pages/people/PeoplePage.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { PersonsService } from "../../api/persons";
import type { Person } from "../../models/Person";
import { useAuth } from "../../contexts/useAuth"; // Для проверки роли
import { ToastContainer, toast } from "react-toastify";
import { api } from "../../api/api"; // Для загрузки фото, если не через сервис
import { TypesOfActivityService } from "../../api/typesOfActivities"; // Импортируем сервис для получения типов деятельности
import type { TypeOfActivity } from "../../models/TypeOfActivity"; // Импортируем тип

const ELEMENTS_PER_PAGE = 9;

export function FamousPeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Состояния для модального окна добавления
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalStep, setModalStep] = useState<number>(1);
  const [name, setName] = useState<string>("");
  const [surname, setSurname] = useState<string>("");
  const [patronymic, setPatronymic] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [typeOfActivityId, setTypeOfActivityId] = useState<string>(""); // Теперь хранит ID
  const [shortInfo, setShortInfo] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdPersonId, setCreatedPersonId] = useState<string | null>(null);

  // Состояния для списка типов деятельности
  const [typesOfActivity, setTypesOfActivity] = useState<TypeOfActivity[]>([]);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(true); // Для индикации загрузки списка

  // Состояния для изменения фото
  const [isChangePhotoModalOpen, setIsChangePhotoModalOpen] =
    useState<boolean>(false);
  const [selectedPersonForPhotoChange, setSelectedPersonForPhotoChange] =
    useState<Person | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [isPhotoSubmitting, setIsPhotoSubmitting] = useState<boolean>(false);
  const [photoFormError, setPhotoFormError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const { getUserRole } = useAuth();
  const userRole = getUserRole();
  const isAdminOrModerator = userRole === "Admin" || userRole === "Moderator";

  const fetchData = useCallback(async (page: number, search: string = "") => {
    setLoading(true);
    setError(null);
    try {
      const response = await PersonsService.getPersons(
        page,
        ELEMENTS_PER_PAGE,
        search
      );
      const responseData = response.data;

      console.log(responseData);

      setPeople(responseData.values);

      const serverTotalCount = responseData.totalCount;
      const calculatedTotalPages = Math.ceil(
        serverTotalCount / ELEMENTS_PER_PAGE
      );
      setTotalPages(calculatedTotalPages);
      setTotalElements(serverTotalCount);

      if (
        responseData.values.length === 0 &&
        calculatedTotalPages > 0 &&
        page > 0
      ) {
        console.warn(
          "Возможно, сервер некорректно сообщил totalCount. Получено 0 элементов на странице",
          page,
          ", но totalCount =",
          serverTotalCount
        );
      }
    } catch (err) {
      console.error("Ошибка при загрузке списка людей:", err);
      setError("Не удалось загрузить список известных людей.");
      setPeople([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
      searchInputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    const fetchTypesOfActivity = async () => {
      try {
        setLoadingTypes(true);
        const response = await TypesOfActivityService.getTypesOfActivity();
        setTypesOfActivity(response.data);
      } catch (err) {
        console.error("Ошибка при загрузке типов деятельности:", err);
        setError("Не удалось загрузить список типов деятельности.");
        setTypesOfActivity([]);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchTypesOfActivity();
  }, []); // Зависимость пустая, значит выполнится один раз при монтировании

  useEffect(() => {
    fetchData(currentPage, searchTerm);
  }, [fetchData, currentPage, searchTerm]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSearchClick = () => {
    setSearchTerm(inputValue);
    setCurrentPage(0);
  };

  const handleResetSearch = () => {
    setInputValue("");
    setSearchTerm("");
    setCurrentPage(0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setModalStep(1);
    setName("");
    setSurname("");
    setPatronymic("");
    setDateOfBirth("");
    setTypeOfActivityId(""); // Сбрасываем выбранный тип
    setShortInfo("");
    setSelectedFile(null);
    setFormError(null);
    setCreatedPersonId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError(null);
  };

  const handleCreatePerson = async () => {
    if (!name.trim() || !surname.trim() || !typeOfActivityId.trim()) {
      setFormError("Имя, фамилия и род деятельности обязательны.");
      return;
    }
    if (name.length > 30) {
      setFormError("Имя не может быть длиннее 30 символов.");
      return;
    }
    if (surname.length > 50) {
      setFormError("Фамилия не может быть длиннее 50 символов.");
      return;
    }
    if (patronymic.length > 50) {
      setFormError("Отчество не может быть длиннее 50 символов.");
      return;
    }
    if (!dateOfBirth) {
      setFormError("Дата рождения обязательна.");
      return;
    }
    if (shortInfo.length > 500) {
      setFormError(
        "Краткая информация слишком длинная (максимум 500 символов)."
      );
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      // Используем тип 'typeOfActivity' в запросе, как ожидает бэкенд
      const response = await PersonsService.createPerson({
        name,
        surname,
        patronymic,
        dateOfBirth: new Date(dateOfBirth).toISOString(),
        typeOfActivity: typeOfActivityId, // Передаём как 'typeOfActivity'
        shortInfo,
      });
      console.log("Ответ от создания человека:", response);
      const newPersonId = response.data;
      if (newPersonId) {
        setCreatedPersonId(newPersonId);
        setModalStep(2);
      } else {
        setFormError("Не удалось получить ID созданного человека.");
      }
    } catch (err: any) {
      console.error("Ошибка при создании человека:", err);
      let errorMessage = "Не удалось создать человека.";
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
    if (!createdPersonId) {
      setFormError("Нет созданного человека для загрузки фото.");
      return;
    }
    if (!selectedFile) {
      setFormError("Пожалуйста, выберите файл для загрузки.");
      return;
    }

    const maxSizeInBytes = 2 * 1024 * 1024;
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
      setFormError(
        "Неподдерживаемый формат файла. Разрешены: JPG, PNG, GIF, WEBP."
      );
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await api.put(`/files/persons/${createdPersonId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      fetchData(currentPage, searchTerm);
      closeModal();
      toast.success("Человек успешно добавлен.", {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (err: any) {
      console.error("Ошибка при загрузке фото человека:", err);
      let errorMessage = "Не удалось загрузить фото человека.";
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

  const openChangePhotoModal = (person: Person) => {
    setSelectedPersonForPhotoChange(person);
    setNewPhotoFile(null);
    setPhotoFormError(null);
    setIsChangePhotoModalOpen(true);
    if (photoFileInputRef.current) {
      photoFileInputRef.current.value = "";
    }
  };

  const closeChangePhotoModal = () => {
    setIsChangePhotoModalOpen(false);
    setSelectedPersonForPhotoChange(null);
    setNewPhotoFile(null);
    setPhotoFormError(null);
    if (photoFileInputRef.current) {
      photoFileInputRef.current.value = "";
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
    if (!selectedPersonForPhotoChange) {
      setPhotoFormError("Человек для изменения фото не выбран.");
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
      // Используем api.put напрямую, как в PlacesPage и AttractionsPage
      await api.put(
        `/files/persons/${selectedPersonForPhotoChange.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // Успешно загружено, обновляем список людей
      fetchData(currentPage, searchTerm); // Перезагружаем текущую страницу с текущим поисковым запросом
      closeChangePhotoModal(); // Закрываем окно
      toast.success("Фото человека успешно обновлено.", {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (err: any) {
      console.error("Ошибка при смене фото человека:", err);
      let errorMessage = "Не удалось изменить фото человека.";
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

  return (
    <div className="container mt-5 mb-5">
      <h1 className="title is-1 has-text-centered mb-6">
        Известные люди Челябинска
      </h1>

      {isAdminOrModerator && (
        <div className="has-text-centered mb-6">
          <button className="button is-primary is-medium" onClick={openModal}>
            Добавить человека
          </button>
        </div>
      )}

      <div className="field mb-6">
        <label className="label is-size-4">Поиск по ФИО</label>
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              ref={searchInputRef}
              className="input is-medium"
              type="text"
              placeholder="Введите фамилию, имя или отчество..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              disabled={loading}
            />
          </div>
          <div className="control">
            <button
              className="button is-medium is-info"
              onClick={handleSearchClick}
              disabled={loading}
            >
              Поиск
            </button>
          </div>
        </div>
        {searchTerm && (
          <div className="control mt-2">
            <button
              className="button is-small is-outlined"
              onClick={handleResetSearch}
              disabled={loading}
            >
              Сбросить поиск
            </button>
          </div>
        )}
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
          <button
            className="button is-small is-light ml-4"
            onClick={() => fetchData(currentPage, searchTerm)}
          >
            Повторить
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="columns is-multiline is-variable is-8">
            {people.length === 0 ? (
              <div className="column is-full">
                <p className="has-text-centered">
                  По вашему запросу "{searchTerm || "(все)"}" ничего не найдено.
                </p>
                {!searchTerm && (
                  <button
                    className="button is-link mt-4"
                    onClick={handleResetSearch}
                  >
                    Сбросить поиск
                  </button>
                )}
              </div>
            ) : (
              people.map((person) => {
                const currentRole = getUserRole();
                const currentIsAdminOrModerator =
                  currentRole === "Admin" || currentRole === "Moderator";

                return (
                  <div
                    key={person.id}
                    className="column is-one-third-desktop is-half-tablet is-full-mobile"
                  >
                    <div
                      className="card"
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* --- Блок изображения с кнопкой изменения для админа --- */}
                      <div
                        className="card-image"
                        style={{ position: "relative" }}
                      >
                        {" "}
                        {/* Добавляем position relative для позиционирования кнопки */}
                        <figure className="image is-1by1">
                          <img
                            src={
                              person.photoLink && person.photoLink.trim() !== ""
                                ? person.photoLink
                                : "errorr"
                            }
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                            onError={(e) => {
                              const imgElement = e.target as HTMLImageElement;
                              const DEFAULT_IMAGE_PATH =
                                "/public/images/image.png";

                              if (imgElement.src.includes(DEFAULT_IMAGE_PATH)) {
                                console.warn(
                                  `Изображение по умолчанию '${DEFAULT_IMAGE_PATH}' также не найдено.`
                                );
                                imgElement.src = DEFAULT_IMAGE_PATH;
                                imgElement.style.height = "128px";
                                imgElement.style.width = "128px";
                                imgElement.style.alignSelf = "center";
                                imgElement.style.justifySelf = "center";
                                imgElement.style.objectFit = "contain";
                                return;
                              }

                              console.warn(
                                `Изображение для '${person.surname}' (${person.photoLink}) не загрузилось. Заменено на изображение по умолчанию.`
                              );
                              imgElement.src = DEFAULT_IMAGE_PATH;
                              imgElement.style.height = "128px";
                              imgElement.style.width = "128px";
                              imgElement.style.alignSelf = "center";
                              imgElement.style.justifySelf = "center";
                              imgElement.style.objectFit = "contain";
                            }}
                          />
                        </figure>
                        {/* --- Кнопка "Изменить фото" всегда видна, если админ/модератор --- */}
                        {currentIsAdminOrModerator && (
                          <div
                            className="card-overlay"
                            style={{
                              position: "absolute",
                              bottom: "10px", // Отступ от нижнего края
                              right: "10px", // Отступ от правого края
                              // Убираем opacity и transition
                            }}
                          >
                            <button
                              className="button is-small is-info"
                              onClick={() => openChangePhotoModal(person)}
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
                        <h2 className="title is-4">{`${person.surname} ${person.name} ${person.patronymic}`}</h2>
                        <div className="content" style={{ flexGrow: 1 }}>
                          <p>{person.shortInfo}</p>
                        </div>
                      </div>
                      {/* Блок для рода деятельности */}
                      <div className="card-footer">
                        <div
                          className="card-footer-item"
                          style={{
                            display: "block",
                            textAlign: "center",
                            cursor: "help",
                          }}
                          title={
                            person.typeOfActivity.description || "Нет описания"
                          }
                        >
                          <strong>Род деятельности:</strong>{" "}
                          {person.typeOfActivity.name}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
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
                disabled={currentPage === 0 || loading}
              >
                Назад
              </button>
              <button
                className="pagination-next"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1 || loading}
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
                          disabled={loading}
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

      {isModalOpen && (
        <div className="modal is-active">
          <div className="modal-background" onClick={closeModal}></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">
                {modalStep === 1 ? "Добавить человека" : "Загрузить фото"}
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
                    <label className="label">Имя *</label>
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Введите имя"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Фамилия *</label>
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        placeholder="Введите фамилию"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Отчество</label>
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        value={patronymic}
                        onChange={(e) => setPatronymic(e.target.value)}
                        placeholder="Введите отчество"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Дата рождения *</label>
                    <div className="control">
                      <input
                        className="input"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Род деятельности *</label>
                    <div className="control">
                      {loadingTypes ? (
                        // Показываем индикатор загрузки, если список ещё не загружен
                        <p className="help">Загрузка типов деятельности...</p>
                      ) : (
                        // Показываем select, если список загружен
                        <div className="select is-fullwidth">
                          {" "}
                          {/* Bulma class для стилизации select */}
                          <select
                            value={typeOfActivityId}
                            onChange={(e) =>
                              setTypeOfActivityId(e.target.value)
                            } // Устанавливаем GUID как строку
                            disabled={isSubmitting || loadingTypes}
                          >
                            <option value="">Выберите род деятельности</option>
                            {typesOfActivity.map((activity) => (
                              <option key={activity.id} value={activity.id}>
                                {activity.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Краткая информация *</label>
                    <div className="control">
                      <textarea
                        className="textarea"
                        value={shortInfo}
                        onChange={(e) => setShortInfo(e.target.value)}
                        placeholder="Введите краткую информацию"
                        disabled={isSubmitting}
                        rows={3}
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
                          name="personPhoto"
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
                      onClick={handleCreatePerson}
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

      {isChangePhotoModalOpen && selectedPersonForPhotoChange && (
        <div className="modal is-active">
          <div
            className="modal-background"
            onClick={closeChangePhotoModal}
          ></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">
                Изменить фото для "{selectedPersonForPhotoChange.surname}{" "}
                {selectedPersonForPhotoChange.name}{" "}
                {selectedPersonForPhotoChange.patronymic}"
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
                      name="newPersonPhoto"
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
