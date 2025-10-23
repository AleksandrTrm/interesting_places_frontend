// src/pages/people/PeoplePage.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { PersonsService } from "../api/persons"; // Убедитесь, что getPersons принимает (page, elementsOnPage, queryWord)
import type { Person } from "../models/Person";
// import { renderToReadableStream } from "react-dom/server"; // Не используется на клиенте

const ELEMENTS_PER_PAGE = 9;

export function FamousPeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Состояние для значения, введённого в поле поиска, но ещё не подтверждённое поиском
  const [inputValue, setInputValue] = useState<string>("");
  // Состояние для значения, по которому реально выполняется поиск
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Состояния для пагинации
  const [currentPage, setCurrentPage] = useState<number>(0); // Страницы начинаются с 0
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Ref для поля ввода, чтобы управлять фокусом
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Функция для получения данных с сервера
  // Функция для получения данных с сервера
  const fetchData = useCallback(async (page: number, search: string = "") => {
    setLoading(true);
    setError(null);
    try {
      // Предполагается, что PersonsService.getPersons принимает 3 аргумента
      const response = await PersonsService.getPersons(
        page,
        ELEMENTS_PER_PAGE,
        search
      );
      const responseData = response.data;

      console.log(responseData);

      // 1. Устанавливаем полученные элементы
      setPeople(responseData.values);

      // 2. Получаем totalCount от сервера
      const serverTotalCount = responseData.totalCount;

      // 3. Пересчитываем totalPages на основе serverTotalCount
      const calculatedTotalPages = Math.ceil(
        serverTotalCount / ELEMENTS_PER_PAGE
      );
      setTotalPages(calculatedTotalPages);
      setTotalElements(serverTotalCount); // Устанавливаем общее количество

      // --- ДОБАВЛЕНА ЗАЩИТА ---
      // Если сервер вернул пустой список, но обещал больше одной страницы,
      // и мы не на первой странице, возможно, сервер ошибся.
      // Проверим, не ушли ли мы за пределы реальных данных.
      if (
        responseData.values.length === 0 &&
        calculatedTotalPages > 0 &&
        page > 0
      ) {
        // Простая эвристика: если на странице N (N>0) ничего нет,
        // возможно, мы уже на последней "реальной" странице или за ней.
        // Можно попробовать перезагрузить первую страницу.
        // Или просто сбросить totalPages, если мы точно знаем, что данных меньше.

        // Более надежный способ: пересчитать totalPages на основе известных данных
        // Это временное решение, пока бэкенд не будет исправлен.
        const recalculatedTotalPagesBasedOnCurrentData = page; // Текущая страница - последняя с данными
        // Но это не решает проблему полностью.

        // Лучше всего - исправить бэкенд.
        console.warn(
          "Возможно, сервер некорректно сообщил totalCount. Получено 0 элементов на странице",
          page,
          ", но totalCount =",
          serverTotalCount
        );
      }
      // --- КОНЕЦ ЗАЩИТЫ ---
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

  // useEffect для загрузки данных при изменении currentPage или searchTerm
  useEffect(() => {
    fetchData(currentPage, searchTerm);
  }, [fetchData, currentPage, searchTerm]);

  // Обработчики пагинации
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

  // Обработчик изменения текста в поле ввода (только обновляет inputValue)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Никакой другой логики здесь нет, фокус не теряется
  };

  // Обработчик клика по кнопке "Поиск"
  const handleSearchClick = () => {
    // Устанавливаем searchTerm, что триггерит useEffect и вызов fetchData
    setSearchTerm(inputValue);
    // Устанавливаем currentPage в 0
    setCurrentPage(0);
    // Фокус будет восстановлен в блоке finally функции fetchData
  };

  // Обработчик сброса поиска
  const handleResetSearch = () => {
    // Очищаем inputValue
    setInputValue("");
    // Очищаем searchTerm, что триггерит useEffect
    setSearchTerm("");
    // Сбрасываем страницу
    setCurrentPage(0);
    // Фокус будет восстановлен в блоке finally функции fetchData
  };

  // Обработчик нажатия Enter в поле ввода
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <h1 className="title is-1 has-text-centered mb-6">
        Известные люди Челябинска
      </h1>

      {/* Поле поиска с кнопкой */}
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
        {/* Кнопка сброса поиска, отображается, если есть активный поиск */}
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
          {/* Добавим кнопку повтора в случае ошибки */}
          <button
            className="button is-small is-light ml-4"
            onClick={() => fetchData(currentPage, searchTerm)}
          >
            Повторить
          </button>
        </div>
      )}

      {/* Отображение результатов поиска или списка */}
      {!loading && !error && (
        <>
          {people.length === 0 ? (
            // Сообщение, если ничего не найдено
            <div className="has-text-centered mt-6">
              <p className="subtitle is-4">
                По вашему запросу "{searchTerm || "(все)"}" ничего не найдено.
              </p>
              {/* Кнопка сброса поиска уже есть выше, если searchTerm не пуст */}
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
            <>
              <div className="columns is-multiline is-variable is-8">
                {people.map((person) => (
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
                      <div className="card-image">
                        <figure className="image is-1by1">
                          <img
                            src={
                              person.photoLink && person.photoLink.trim() !== ""
                                ? person.photoLink
                                : "/public/images/image.png"
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
                                // Визуальный индикатор отсутствия изображения
                                imgElement.style.border = "2px dashed #ccc";
                                imgElement.style.backgroundColor = "#f5f5f5";
                                imgElement.alt = "Изображение недоступно";
                                imgElement.style.width = "100%";
                                imgElement.style.height = "100%";
                                imgElement.style.objectFit = "contain";
                                return;
                              }

                              console.warn(
                                `Изображение для '${person.surname}' (${person.photoLink}) не загрузилось. Заменено на изображение по умолчанию.`
                              );
                              imgElement.src = DEFAULT_IMAGE_PATH;
                              // Применяем стили для дефолтного изображения
                              imgElement.style.height = "128px";
                              imgElement.style.width = "128px";
                              imgElement.style.alignSelf = "center";
                              imgElement.style.justifySelf = "center";
                              imgElement.style.objectFit = "contain";
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
                        {/* Отображаем полное имя */}
                        <h2 className="title is-4">{`${person.surname} ${person.name} ${person.patronymic}`}</h2>
                        <div className="content" style={{ flexGrow: 1 }}>
                          <p>{person.shortInfo}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Пагинация */}
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
                          pageNumber === 0 || // Первая страница
                          pageNumber === totalPages - 1 || // Последняя страница
                          (pageNumber >= currentPage - 1 &&
                            pageNumber <= currentPage + 1) // Страницы вокруг текущей
                      )
                      .map((pageNumber, index, filteredPages) => {
                        const showEllipsisBefore =
                          index > 0 &&
                          pageNumber > filteredPages[index - 1] + 1;

                        return (
                          <li key={pageNumber}>
                            {showEllipsisBefore && (
                              <span className="pagination-ellipsis">
                                &hellip;
                              </span>
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
        </>
      )}
    </div>
  );
}
