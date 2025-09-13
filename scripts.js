// Filters Section Enable / Disable

  const enableSearchTypeButtons = false;  // set true to enable
  
  
  const buttonsContainer = document.getElementById('searchTypeButtonsContainer');
  if (!enableSearchTypeButtons) buttonsContainer.style.display = 'none';

  
// Firebase Credentials & Initialization
  
    const firebaseConfig =
    {
        apiKey: "AIzaSyBF1hRE2scvmQBIyRNBT7EPZl5PFLEzeTk",
        authDomain: "library-database-306ec.firebaseapp.com",
        projectId: "library-database-306ec",
        storageBucket: "library-database-306ec.firebasestorage.app",
        messagingSenderId: "155778078089",
        appId: "1:155778078089:web:2e59a765a4d9902cca3d58"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

// Auto-expand textarea

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
  
    if (searchInput.value.trim()) {
    // If there's text → expand the height of the textbox based on text visible
    searchInput.style.height = 'auto';
    searchInput.style.height = searchInput.scrollHeight + 'px';
  } else {
    // If empty → reset to single-line
    searchInput.style.height = 'auto';
  }
});


// Search Functionality
  const searchBtn = document.getElementById('searchBtn');
  const resultsSection = document.getElementById('searchResultsSection');
  const resultsList = document.getElementById('searchResultsList');
  const noResultsMsg = document.getElementById('noResultsMessage');
  const clearBtn = document.getElementById('clearBtn');

// Show/hide clear button

  searchInput.addEventListener('input', () => {
  clearBtn.style.display = searchInput.value ? 'block' : 'none';

  if (searchInput.value) {
    searchInput.classList.add('has-text');
  } else {
    searchInput.classList.remove('has-text');
  }
});

// Clear search input    
    clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.value = '';
    searchInput.style.height = 'auto'; // reset 
    clearBtn.style.display = 'none';
    searchInput.focus();
    // Optional: hide search results when cleared
    if (typeof resultsSection !== 'undefined') resultsSection.style.display = 'none';
    });


// Store original placeholder so we can restore it later
  
        const originalPlaceholder = searchInput.placeholder || '';
        let searchType = null;
        const typeButtons = document.querySelectorAll('.searchTypeBtn');
        typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
        const clickedType = btn.getAttribute('data-type');

        if (searchType === clickedType)
            {
                // toggle off if same button clicked again
                searchType = null;
                btn.classList.remove('active');

                // if it was rack, restore placeholder
                if (clickedType === 'rack')
                {
                    searchInput.placeholder = originalPlaceholder;
                }
            }
            else 
            {
                // switch to new filter
                searchType = clickedType;
                typeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // change placeholder only when rack is selected
                if (clickedType === 'rack')
                {
                    searchInput.placeholder = "Enter a Rack Number";
                }
                else
                {
                    searchInput.placeholder = originalPlaceholder;
                }
            }
        });
    });


  // ✅ Main search functionality

  async function performSearch()
  {
    const query = searchInput.value.trim().toLowerCase();
    if (!query)
     {
      resultsSection.style.display = 'none';
      return;
     }

    resultsSection.style.display = 'block';
    resultsList.innerHTML = '';
    noResultsMsg.style.display = 'none';

    try {
      const snapshot = await db.collection('All_Books').get();

      if (snapshot.empty) {
        noResultsMsg.style.display = 'block';
        noResultsMsg.textContent = 'No books found in the database.';
        return;
      }

      // Gather all books

      const allBooks = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        allBooks.push({
          title: data.bookName || '',
          author: data.author || '',
          publication: data.publication || '',
          edition: data.edition || '',
          quantity: data.quantity || '',
          rack: data.rack || '',
          shelf: data.shelf || '',
          volume: data.volume || ''
        });
      });

        // Filter books based on search type

                const matchedBooks = allBooks.filter(book => {
                let targetFields = [];
                if (searchType === 'rack') targetFields = [book.rack];
                else targetFields = [book.title, book.author, book.publication];

                const combinedText = targetFields.join(' ').toLowerCase();
                return combinedText.includes(query);
            });


        // Show no results message if nothing matched
            if (matchedBooks.length === 0)
             {
                noResultsMsg.style.display = 'block';
                noResultsMsg.textContent = 'No Book available.';
                return;
            }

        // Dynamically create book tiles
    
                matchedBooks.forEach(book => {
                const card = document.createElement('div');
                card.className = 'book-tile';

        // Book title
        let html = `<h4>${book.title}</h4>`;

        // Author (optional fallback)
        if (book.author) html += `<p><strong>Author:</strong> ${book.author}</p>`;

        // Extra details dynamically
        const extraFields = ['publication','edition','volume','quantity','rack','shelf'];
        let extraHtml = '';
        extraFields.forEach(field => {
            if (book[field]) {
                if (field === 'rack' || field === 'shelf') {
                    extraHtml += `<p class="${field}">${field.charAt(0).toUpperCase() + field.slice(1)}: ${book[field]}</p>`;
                } else {
                    extraHtml += `<p><strong>${field.charAt(0).toUpperCase() + field.slice(1)}:</strong> ${book[field]}</p>`;
                }
            }
        });

        html += `<div class="extra-details" aria-hidden="true">${extraHtml}</div>`;
        card.innerHTML = html;

    // Toggle "Book Tile " expansion on click

                    card.addEventListener('click', () => {
                        document.querySelectorAll('.book-tile.expanded').forEach(otherCard => {
                            if (otherCard !== card) {
                                otherCard.classList.remove('expanded');
                                otherCard.querySelector('.extra-details').setAttribute('aria-hidden', 'true');
                            }
                        });
                        const extraDetails = card.querySelector('.extra-details');
                        const isExpanded = card.classList.toggle('expanded');
                        extraDetails.setAttribute('aria-hidden', isExpanded ? 'false' : 'true');
                    });

                resultsList.appendChild(card);
            });

            } catch (error) {
            console.error("Error fetching books: ", error);
            noResultsMsg.style.display = 'block';
            noResultsMsg.textContent = 'Error fetching books.';
            }
        }


  // ✅ Run search when button is clicked
        searchBtn.addEventListener('click', performSearch);

  // ✅ Run search when pressing Enter
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === "Enter" || event.code === "NumpadEnter") {
            event.preventDefault();
            performSearch();
            }
        });
  


        
