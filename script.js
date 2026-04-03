const searchBtn = document.getElementById('search-btn')
const searchInput = document.getElementById('search-bar')
const errorMsg = document.getElementById('error-state')
const movieGrid = document.getElementById('movie-grid')
const loadingState = document.getElementById('loading-state')
const errorState = document.getElementById('error-state')
const movieModal = document.getElementById('movie-modal')
const closeSpan = document.getElementById('span')
const results = document.getElementById('results')
const resultLoad = document.getElementById('result-load')
const favoriteField = document.getElementById('favorite-field')
const favoriteHeading = document.querySelector('#favorite-field h2')
const favoriteGrid = document.getElementById('favorites-grid')
const yearSelect = document.querySelector('select[name="year"]')
const typeSelect = document.querySelector('select[name="type"]')
const sortSelect = document.querySelector('select[name="sort"]')
const clearFilter = document.querySelector('.clear-filters')
const paginationDiv = document.querySelector('.pagination')
const activeYear = document.getElementById('active-year')
const activeType = document.getElementById('active-type')
const activeFilter = document.getElementById('active-filters')

let favorites = []
let currentPage = 1

try{
    favorites = JSON.parse(localStorage.getItem('favorites')) || []
}catch{
    favorites = []
}

for (let year = 2026; year >= 1975; year--) {
    const option = document.createElement('option')
    option.value = year
    option.textContent = year
    yearSelect.appendChild(option)
}

yearSelect.addEventListener('change', function(){
    updateFilterChips()
    searchFunction()
})

typeSelect.addEventListener('change', function(){
    updateFilterChips()
    searchFunction()
})

sortSelect.addEventListener('change', function(){
    searchFunction()
})

function updateLocalStorage(){
    localStorage.setItem("favorites", JSON.stringify(favorites))
}

clearFilter.addEventListener('click', function(){
    currentPage = 1
    yearSelect.value = "all-year"
    typeSelect.value = "all-type"
    searchInput.value = ""
    sortSelect.value = "sort-by"
    results.innerHTML = `<div class="empty-state">Search for a movie to begin!</div>`;
    errorMsg.style.display = 'none'
    updateFilterChips()
})

async function searchFunction(isLoadMore = false){
    const searchInputValue = searchInput.value.trim()
    const selectedYear = yearSelect.value
    const selectedType = typeSelect.value
    const selectedSort = sortSelect.value

    if(!searchInputValue){
        errorMsg.style.display = 'block'
        paginationDiv.style.display = 'none';
        return
    }else{
        errorMsg.style.display = 'none'
    }

    if(!isLoadMore){
        currentPage = 1
        movieGrid.innerHTML = `<div class="loading-state">Loading movies...</div>`
        results.innerHTML = ""
    }
    
    try {
        const apiKey = '41b39dd6'
        let url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${searchInputValue}&page=${currentPage}`

        if(selectedYear && selectedYear !== 'all-year'){
            url += `&y=${selectedYear}`
        }

        if(selectedType && selectedType !== 'all-type'){
            url += `&type=${selectedType}`
        }

        const response = await fetch(url)
        if(!response.ok){
            throw new Error(`${response.status}`)
        }

        const data = await response.json()

        if(data.Response === "True"){
            let searchData = data.Search
            if(selectedSort === 'title'){
                searchData.sort(function(a,b){
                    return a.Title.localeCompare(b.Title)
                })
            }else if(selectedSort === 'year'){
                searchData.sort(function(a,b){
                    return parseInt(b.Year) - parseInt(a.Year)
                })
            }

            if(!isLoadMore){
                results.innerHTML = `
                    <div class="results-header">
                        <h2>Results</h2>
                        <span id="movie-number">${data.totalResults} movies found</span>
                    </div>
                `
                movieGrid.innerHTML = ''
            }

            searchData.forEach(function(movie){
                const div = document.createElement('div')
                div.classList.add('card')
                div.dataset.id = `${movie.imdbID}`
                const isFav = favorites.some(function(fav){
                    return fav.imdbID === movie.imdbID
                })
                const heart = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>'
                const poster = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Image";
                div.innerHTML = `
                    <img class="poster" src="${poster}" alt="${movie.Title}">
                    <div class="card-body">
                        <div class="title">${movie.Title}</div>

                        <div class="meta">
                            <span>${movie.Year}</span>
                            <span class="badge">${movie.Type}</span>
                        </div>

                        <div class="meta">
                            <span class="favorite" data-id="${movie.imdbID}">${heart}</span>
                        </div>
                    </div> 
                `
                movieGrid.appendChild(div)
            })
            
            const totalFetched = currentPage * 10 
            if(totalFetched < parseInt(data.totalResults)){
                paginationDiv.innerHTML = `<button>Load More</button>`
                paginationDiv.style.display = 'block'
            }else{
                paginationDiv.style.display = 'none'
            }
        
            results.appendChild(movieGrid)
            results.appendChild(paginationDiv)
        }else{
            if(!isLoadMore) {
                results.innerHTML = `<div class="empty-state">No movies found</div>`
            }
        }
    } catch(error) {
        movieGrid.innerHTML = `<div class="error-state" id='error-state'>
        <p>Something went wrong (${error.message})</p>
        <button class="btn" onclick = "searchFunction()"> Try Again </button> 
        </div>`
    }
}

async function getMovieDetail(movieId) {
    const apiKey = '41b39dd6'
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${movieId}`

    try {
        const response = await fetch(url)
        if(!response.ok){
            throw new Error(`Error: ${response.status}`)
        }

        const movie = await response.json()

        if(movie.Response === "True"){
            const isFavorite = favorites.some(function(fav){
                return fav.imdbID === movie.imdbID
            });
            const buttonText = isFavorite ? "Remove from Favorites" : "Add to Favorites";

            movieModal.innerHTML = ""
            const div = document.createElement('div')
            div.classList.add('modal-content')

            let posterUrl = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Image";
            div.innerHTML = `
                <span class="close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></span>
                 <div class="modal-body">
                    <div class="modal-poster">
                        <img src="${posterUrl}" alt="${movie.Title}">
                    </div>
                    <div class="modal-info">
                        <h2>${movie.Title}</h2>
                        <div class="modal-meta">
                            <span class="badge">${movie.Year}</span>
                            <span class="badge">${movie.Genre}</span>
                            <span class="rating"><i class="fa-solid fa-star"></i> ${movie.imdbRating} / 10</span>
                            <span class="badge">${movie.Rated}</span>
                        </div>
                        <p><strong>Runtime:</strong> ${movie.Runtime}</p>
                        <p><strong>Director:</strong> ${movie.Director}</p>
                        <p><strong>Actors:</strong> ${movie.Actors}</p>
                        <p class="plot"><strong>Plot:</strong> ${movie.Plot}</p>
                        <button class="fav-btn">${buttonText}</button>
                     </div>
                </div>
            `
            movieModal.style.display = 'block'
            document.body.style.overflow = 'hidden'
            movieModal.appendChild(div)

            const favoriteBtn = movieModal.querySelector('.fav-btn')
            favoriteBtn.addEventListener('click', function(){
                const moveToFavorite = {
                    imdbID: movie.imdbID,
                    Title: movie.Title,
                    Year: movie.Year,
                    Poster: posterUrl,
                    Type: movie.Type,
                    addedDate: new Date().toLocaleDateString()
                }
                handleFavorite(moveToFavorite)
            })
        }
    } catch (error) {
        movieModal.style.display = 'block'
        movieModal.innerHTML = `
            <p>No detail available (Error: ${error.message})</p>
            <button class="btn" onclick="getMovieDetail('${movieId}')">Try Again</button>
            <span class="close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></span>
            `
    }
}

function handleFavorite(movie){
    const exists = favorites.some(function(favorite){
        return favorite.imdbID === movie.imdbID
    })

    if(exists){
        favorites = favorites.filter(function(favorite){
            return favorite.imdbID !== movie.imdbID
        })
    }else{
        favorites.unshift(movie)
    }

    updateLocalStorage()
    displayFavorite()
    closeModal()
}

function displayFavorite(){
    if(favorites.length === 0){
        favoriteGrid.innerHTML = `<div class="empty-state">No favorites yet</div>`
        favoriteHeading.textContent = `Favorites (0)`
        return;
    }

    favoriteGrid.innerHTML = ""

    favoriteHeading.textContent = `Favorites (${favorites.length})`

    favorites.forEach(function(favorite){
        const card = document.createElement('div')
        card.classList.add('card')
        card.innerHTML = `
            <img class="poster" src="${favorite.Poster}" alt="${favorite.Title}">
            <div class="card-body">
                <div class="title">${favorite.Title}</div>

                <div class="meta">
                    <span>${favorite.Year}</span>
                    <span class="badge">${favorite.Type}</span>
                </div>

                <div class="meta">
                    <button onclick = "removeFavorite('${favorite.imdbID}')" class="badge">Remove ♡</button>
                </div>
            </div>
        `
        favoriteGrid.appendChild(card)
    })
}

function removeFavorite(movieId){
    favorites = favorites.filter(function(fav){
        return fav.imdbID !== movieId
    })
    updateLocalStorage()
    displayFavorite()
}

window.addEventListener('click', function(event){
    if (event.target === movieModal) {
        closeModal();
    }
});

window.addEventListener('keydown', function(event){
    if(event.key === 'Escape'){
        closeModal()
    }
})

movieGrid.addEventListener('click', function(event){
    const heartEl = event.target.closest('.favorite')
    if(heartEl){
        event.stopPropagation()
        const movieId = heartEl.dataset.id
        toggleFavoriteFromCard(movieId, heartEl)
        return
    }

    const clickedCard = event.target.closest('.card')
    if(!clickedCard)return;

    const movieId = clickedCard.dataset.id
    getMovieDetail(movieId)
})

function toggleFavoriteFromCard(movieId, heartEl){
    const card = heartEl.closest('.card')
    const title = card.querySelector('.title').textContent
    const year = card.querySelector('.meta span').textContent
    const poster = card.querySelector('img').src
    const type = card.querySelector('.badge').textContent

    const movie = {
        imdbID: movieId,
        Title: title,
        Year: year,
        Poster: poster,
        Type: type,
        addedDate: new Date().toLocaleDateString()
    }

    const exists = favorites.some(function(fav){
        return fav.imdbID === movieId
    })

    if(exists){
        favorites = favorites.filter(function(fav){
            return fav.imdbID !== movieId
        })
        heartEl.innerHTML = '<i class="far fa-heart"></i>'
    }else{
        favorites.unshift(movie)
        heartEl.innerHTML = '<i class="fas fa-heart"></i>'
    }

    updateLocalStorage()
    displayFavorite()
}

function closeModal(){
    movieModal.style.display = 'none'
    document.body.style.overflow = 'auto';
}

closeSpan.addEventListener('click', closeModal)

searchBtn.addEventListener('click', searchFunction)
searchInput.addEventListener('keydown', function(event){
    if(event.key === 'Enter'){
        searchFunction()
    }
})

let debounceTimer;
searchInput.addEventListener('input', function(){
    let searchInputValue = searchInput.value.trim()

    if(searchInputValue){
        errorMsg.style.display = 'none'
    }

    const query = searchInput.value.trim();

    if(query){
        errorMsg.style.display = 'none'
    }

    clearTimeout(debounceTimer)

    debounceTimer = setTimeout(() => {
        if(query.length > 2){
            searchFunction();
        }
    }, 500)
})

displayFavorite()

paginationDiv.addEventListener('click', function(event){
    if(event.target.tagName === 'BUTTON'){
        currentPage++
        searchFunction(true)
    }
})

function updateFilterChips(){
    activeFilter.innerHTML =""
    if(yearSelect.value !== 'all-year'){
        const yearChip = document.createElement('div')
        yearChip.classList.add('chip')
        yearChip.dataset.filterType = 'year';
        yearChip.innerHTML = `${yearSelect.value} <span>✕</span>`
        activeFilter.appendChild(yearChip)
    }

    if(typeSelect.value!== "all-type"){
        const typeChip = document.createElement('div')
        typeChip.classList.add('chip')
        typeChip.dataset.filterType = 'type'
        typeChip.innerHTML = `${typeSelect.value} <span>✕</span>`
        activeFilter.appendChild(typeChip)
    }
}

activeFilter.addEventListener('click', function(event){
    const chip = event.target.closest('.chip')
    if(!chip) return;

    const filterToReset = chip.dataset.filterType

    if(filterToReset === 'year'){
        yearSelect.value = 'all-year'
    }else if (filterToReset === "type") {
        typeSelect.value = 'all-type'
    }

    updateFilterChips();
    searchFunction();
})

