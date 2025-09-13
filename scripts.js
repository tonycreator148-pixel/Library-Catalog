
  const enableSearchTypeButtons = false;  // set true to enable
  const buttonsContainer = document.getElementById('searchTypeButtonsContainer');
  if (!enableSearchTypeButtons) buttonsContainer.style.display = 'none';

  const firebaseConfig = {
    apiKey: "AIzaSyBF1hRE2scvmQBIyRNBT7EPZl5PFLEzeTk",
    authDomain: "library-database-306ec.firebaseapp.com",
    projectId: "library-database-306ec",
    storageBucket: "library-database-306ec.firebasestorage.app",
    messagingSenderId: "155778078089",
    appId: "1:155778078089:web:2e59a765a4d9902cca3d58"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
  searchInput.style.height = 'auto'; // reset height
  searchInput.style.height = searchInput.scrollHeight + 'px'; // expand
});
  const searchBtn = document.getElementById('searchBtn');
  const resultsSection = document.getElementById('searchResultsSection');
  const resultsList = document.getElementById('searchResultsList');
  const noResultsMsg = document.getElementById('noResultsMessage');

  const clearBtn = document.getElementById('clearBtn');

searchInput.addEventListener('input', () => {
  clearBtn.style.display = searchInput.value ? 'block' : 'none';
});

clearBtn.addEventListener('click', (e) => {
  e.preventDefault();
  searchInput.value = '';
  clearBtn.style.display = 'none';
  searchInput.focus();
  // Optional: hide search results when cleared
  if (typeof resultsSection !== 'undefined') resultsSection.style.display = 'none';
});




  // store original placeholder so we can restore it later
  const originalPlaceholder = searchInput.placeholder || '';

  let searchType = null;
  const typeButtons = document.querySelectorAll('.searchTypeBtn');

  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const clickedType = btn.getAttribute('data-type');

      if (searchType === clickedType) {
        // toggle off if same button clicked again
        searchType = null;
        btn.classList.remove('active');

        // if it was rack, restore placeholder
        if (clickedType === 'rack') {
          searchInput.placeholder = originalPlaceholder;
        }
      } else {
        // switch to new filter
        searchType = clickedType;
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // change placeholder only when rack is selected
        if (clickedType === 'rack') {
          searchInput.placeholder = "Enter a Rack Number";
        } else {
          searchInput.placeholder = originalPlaceholder;
        }
      }
    });
  });

  // ✅ Main search function
  async function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
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

      const matchedBooks = allBooks.filter(book => {
        let targetFields = [];
        if (searchType === 'rack') targetFields = [book.rack];
        else targetFields = [book.title, book.author, book.publication];

        const combinedText = targetFields.join(' ').toLowerCase();
        return combinedText.includes(query);
      });

      if (matchedBooks.length === 0) {
        noResultsMsg.style.display = 'block';
        noResultsMsg.textContent = 'No Book available.';
        return;
      }

      matchedBooks.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-tile';
        card.innerHTML = `
          <h4>${book.title}</h4>
          <p><strong>Author:</strong> ${book.author || 'Unknown'}</p>
          <div class="extra-details" aria-hidden="true">
            ${book.publication ? `<p><strong>Publication:</strong> ${book.publication}</p>` : ''}
            ${book.edition ? `<p><strong>Edition:</strong> ${book.edition}</p>` : ''}
            ${book.volume ? `<p><strong>Volume:</strong> ${book.volume}</p>` : ''}
            ${book.quantity ? `<p><strong>Quantity:</strong> ${book.quantity}</p>` : ''}
            ${book.rack ? `<p class="rack">Rack: ${book.rack}</p>` : ''}
            ${book.shelf ? `<p class="shelf">Shelf: ${book.shelf}</p>` : ''}
          </div>
        `;
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
  
