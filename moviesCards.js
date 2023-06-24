import { movies$ } from "./movies";
import { useState, useEffect, createContext, useContext } from "react";

//Context pour passer les states et setters dont MovieCard a besoin
//Pas nécessaire ici puisqu'il n'y a qu'un niveau, mais plus propre
const movieContext = createContext({
    movies : [],
    setMovies : () => {},
    displayLikes : true,
});
const useMovies = () => useContext(movieContext);



//Une carte contenant le titre du film, sa catégorie, une progress bar représentant le ratio likes/dislikes et un boutton pour supprimer le film de la liste
function MovieCard({id}) {
    //Récupère les données grâce au Context
    const {movies, setMovies, displayLikes} = useMovies()
    //Sélectionne le film correspondant à id
    const movie = movies.filter(m => m.id==id)[0]
    
    //Affiche la progress bar seulement si displayLikes est true
    return <div className="card">
        <div className="container">
            <h4><b>{movie.title}</b></h4>
            {movie.category}<br/><br/>
            {displayLikes && <>
                <progress className="likeRatio" value={movie.likes} max={movie.likes+movie.dislikes}/><br/>
                Total votes :{" "+(movie.likes+movie.dislikes)}<br/><br/>
            </>}
            <button onClick={() => setMovies(mList => mList.filter(m => m.id != id))}>Delete</button>
        </div>
    </div>
}



export default function MoviesCards() {
    const [movies, setMovies] = useState([])                //Liste des movies
    const [prevLength, setPrevLength] = useState(0)         //Taille précédente de la liste movies 
    const [nbrDisplayed, setNbrDisplayed] = useState(4)     //Nombre de cartes affichées
    const [page, setPage] = useState(0)                     //Numéro de page
    const [displayLikes, setDisplayLikes] = useState(true)  //Booléen indiquant si les ratio likes/dislikes doivent être affichés
    const [categories, setCategories] = useState([])        //Liste des catégories de film dans movies
    const [catDisplayed, setCatDisplayed] = useState([])    //Liste de booléens permettant de filtrer par catégories

    //Récupère les données de movies$ et initialise les states qui en dépendent
    useEffect(() => {
        async function getMovies() {
            const refMovies = await movies$;
            setMovies(refMovies);
            setPrevLength(refMovies.length);
            //"No Filter" pour le multiselect, Set afin d'enlever les doublons 
            const newCat = ["No Filter",...new Set(refMovies.map(m => m.category))]
            setCategories(newCat);
            setCatDisplayed(Array(newCat.length).fill(true))
        }
        getMovies()
    },[])

    //Si un film a été suprimé
    if (prevLength != movies.length) {
        setPrevLength(movies.length);
        //Update categories
        const newCat = ["No Filter",...new Set(movies.map(m => m.category))]
        setCategories(newCat);
        //Si une catégorie n'existe plus
        if (newCat.length != categories.length) {
            //Récupère l'index de la catégorie supprimée
            const deletedCatIndex = categories.reduce((acc,c,i) => (newCat.includes(c) ? acc : i),-1)
            //Génère le filtre correspondant au nouveau categories
            const newCatDisplayed = catDisplayed.filter((c,i) => i!=deletedCatIndex)
            //Si le nouveau filtre a au moins 1 true
            if (newCatDisplayed.reduce((acc,cd) => acc || cd)) {
                setCatDisplayed(newCatDisplayed)
            } else {
                //Réinitialise le filtre
                setCatDisplayed(Array(newCat.length).fill(true))
            }
        }
    }

    //Gère le multiselect
    function handleMultiSelect(event) {
        const selected = [...event.target.options].map(o => o.selected)
        //Si "No Filter" a été sélectionné
        if (selected[0]) {
            setCatDisplayed(cd => Array(cd.length).fill(true))
        } else {
            setCatDisplayed(selected)
        }
        setPage(0)
    }

    //Gère le choix du nbr de cartes par page
    function handleSelect(event) {
        setNbrDisplayed(event.target.value)
        setPage(0)
    }

    //Liste des catégories filtrée
    const filteredCategories = categories.filter((c,i) => catDisplayed[i])
    //Liste des films filtrée
    const filteredMovies = movies.filter(m => filteredCategories.includes(m.category))

    //Gère le bouton Previous
    function handlePrev(event) {
        if (page > 0) {
            setPage(page-1)
        }
    }

    //Gère le bouton Next
    function handleNext(event) {
        if (page + 1 < filteredMovies.length/nbrDisplayed) {
            setPage(page+1)
        }
    }

    //Renvoie un Component contenant un toggle pour les likes/dislikes, un multiselect pour filtrer par catégorie, un select pour choisir le nombre de cartes par page,
    //deux boutons pour changer de page et un conteneur de carte de films
    return <movieContext.Provider value={({movies, setMovies, displayLikes})}>
        <button onClick={() => setDisplayLikes(!displayLikes)}>Toggle Likes/Dislikes</button><br/><br/>
        Filter by categories :<br/>
        <select onChange={handleMultiSelect} multiple>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select><br/><br/>
        Number of cards displayed :{" "}
        <select onChange={handleSelect} value={nbrDisplayed}>
            <option value={4}>4</option>
            <option value={8}>8</option>
            <option value={12}>12</option>
        </select><br/><br/>
        <button onClick={handlePrev}>&larr;</button>
        {" "}Page {page+1} of {Math.ceil(filteredMovies.length/nbrDisplayed)}{" "}
        <button onClick={handleNext}>&rarr;</button>
        <div className="cardsContainer">
            {filteredMovies.length>0 && filteredMovies.slice(page*nbrDisplayed,Math.min(filteredMovies.length,(page+1)*nbrDisplayed)).map(m => <MovieCard key={m.id} id={m.id}/>)}  
        </div>
    </movieContext.Provider>
}