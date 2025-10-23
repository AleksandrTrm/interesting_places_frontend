// src/pages/attractions/AttractionsPage.tsx
import { useState, useEffect } from "react";
import { AttractionsService } from "../api/attractions";
import type { Attraction } from "../models/Attraction";

const ELEMENTS_PER_PAGE = 9; // Количество элементов на странице

export function Attractions() {
  const [attractions, setAttractions] = useState<Attraction[]>([]); // Указываем правильный тип
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0); // Страницы начинаются с 0
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  const fetchData = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      // Предполагается, что AttractionsService.getAttractions принимает страницу и кол-во элементов
      const response = await AttractionsService.getAttractions(
        page,
        ELEMENTS_PER_PAGE
      );
      const responseData = response.data;

      console.log(responseData);

      setAttractions(responseData.values); // Используем .values как в Places
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

  return (
    <div className="container mt-5 mb-5">
      <h1 className="title is-1 has-text-centered mb-6">
        Достопримечательности Челябинска
      </h1>

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
              attractions.map((attraction) => (
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
                    <div className="card-image">
                      <figure className="image is-4by3">
                        <img
                          src={
                            attraction.photoLink == ""
                              ? "error"
                              : attraction.photoLink
                          }
                          alt={attraction.title}
                          onError={(e) => {
                            const imgElement = e.target as HTMLImageElement;
                            const DEFAULT_IMAGE_PATH =
                              "/public/images/image.png";

                            if (imgElement.src.includes(DEFAULT_IMAGE_PATH)) {
                              console.warn(
                                `Изображение по умолчанию '${DEFAULT_IMAGE_PATH}' также не найдено.`
                              );
                              return;
                            }

                            console.warn(
                              `Изображение для '${attraction.title}' не загрузилось. Заменено на изображение по умолчанию.`
                            );
                            imgElement.src = DEFAULT_IMAGE_PATH;

                            imgElement.style.height = "128px";
                            imgElement.style.width = "128px";
                            imgElement.style.alignSelf = "center";
                            imgElement.style.justifySelf = "center";
                            imgElement.src = DEFAULT_IMAGE_PATH;
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
                      <h2 className="title is-4">{attraction.title}</h2>
                      <div className="content" style={{ flexGrow: 1 }}>
                        {/* Отображаем дату, предполагая, что это год или дата */}
                        <p>
                          <strong>Год основания/появления:</strong>{" "}
                          {new Date(attraction.dateOfBorn).getFullYear()}
                        </p>
                        <p>
                          {attraction.description || "Описание отсутствует"}
                        </p>
                        {/* Добавьте другие поля достопримечательности, если нужно */}
                      </div>
                    </div>
                  </div>
                </div>
              ))
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
                      pageNumber === 0 || // Первая страница
                      pageNumber === totalPages - 1 || // Последняя страница
                      (pageNumber >= currentPage - 1 &&
                        pageNumber <= currentPage + 1) // Страницы вокруг текущей
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
    </div>
  );
}
