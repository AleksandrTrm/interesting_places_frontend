// src/pages/moderator/PlacesApprovement.tsx
import { useState, useEffect } from "react";
import { PlacesService } from "../../api/places"; // Убедитесь, что в сервисе есть метод getPendingPlaces
import type { Place } from "../../models/Place";
import { toast } from "react-toastify"; // Импортируем toast для уведомлений

const ELEMENTS_PER_PAGE = 9;

export function ModeratorMain() {
  const [places, setPlaces] = useState<Place[]>([]); // Используем тип Place
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [isActionLoading, setIsActionLoading] = useState<{
    [key: string]: boolean;
  }>({}); // Для отслеживания загрузки на уровне карточки

  const fetchPendingPlaces = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await PlacesService.getPendingPlaces(
        page,
        ELEMENTS_PER_PAGE
      );
      const responseData = response.data;

      setPlaces(responseData.values || []);
      setTotalElements(responseData.totalCount || 0);

      const calculatedTotalPages = Math.ceil(
        responseData.totalCount / ELEMENTS_PER_PAGE
      );
      setTotalPages(calculatedTotalPages);
    } catch (err) {
      console.error("Ошибка при загрузке мест на одобрение:", err);
      setError("Не удалось загрузить список мест на одобрение.");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPlaces(currentPage);
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

  const handleApprove = async (placeId: string) => {
    setIsActionLoading((prev) => ({ ...prev, [placeId]: true }));
    try {
      await PlacesService.approvePlace(placeId);
      toast.success("Место одобрено!");
      fetchPendingPlaces(currentPage);
    } catch (err: any) {
      console.error("Ошибка при одобрении места:", err);
      let errorMessage = "Не удалось одобрить место.";
      if (
        err.response &&
        err.response.data &&
        typeof err.response.data === "string"
      ) {
        errorMessage = err.response.data;
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsActionLoading((prev) => ({ ...prev, [placeId]: false }));
    }
  };

  const handleDelete = async (placeId: string) => {
    // Используем placeId
    setIsActionLoading((prev) => ({ ...prev, [placeId]: true }));
    try {
      await PlacesService.deletePlace(placeId);
      toast.success("Место удалено!");
      fetchPendingPlaces(currentPage);
    } catch (err: any) {
      console.error("Ошибка при удалении места:", err);
      let errorMessage = "Не удалось удалить место.";
      if (
        err.response &&
        err.response.data &&
        typeof err.response.data === "string"
      ) {
        errorMessage = err.response.data;
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsActionLoading((prev) => ({ ...prev, [placeId]: false }));
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <h1 className="title is-1 has-text-centered mb-6">Места на одобрение</h1>

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
                  key={place.id || place.title} // Используем уникальный ID если есть
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
                              : "/public/images/image.png" // Или используйте вашу логику с onError
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
                      {/* Кнопки одобрить/удалить */}
                      <div className="card-footer">
                        <button
                          className={`card-footer-item button is-success ${
                            isActionLoading[place.id] ? "is-loading" : ""
                          }`}
                          onClick={() => handleApprove(place.id)}
                          disabled={isActionLoading[place.id]}
                        >
                          Одобрить
                        </button>
                        <button
                          className={`card-footer-item button is-danger ${
                            isActionLoading[place.id] ? "is-loading" : ""
                          }`}
                          onClick={() => handleDelete(place.id)}
                          disabled={isActionLoading[place.id]}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="column is-full">
                <p className="has-text-centered">Нет мест на одобрение.</p>
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
    </div>
  );
}
