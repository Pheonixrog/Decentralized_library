module library_addr::LibraryManager {

    use aptos_framework::account;
    use std::signer;
    use aptos_framework::event;
    use std::string::String;
    use aptos_std::table::{Self, Table};
    #[test_only]
    use std::string;

    // Errors
    const E_NOT_INITIALIZED: u64 = 1;
    const EBOOK_DOESNT_EXIST: u64 = 2;
    const EBOOK_ALREADY_BORROWED: u64 = 3;
    const EBOOK_NOT_BORROWED: u64 = 4;

    struct Library has key {
        books: Table<u64, Book>,
        book_counter: u64
    }

    #[event]
    struct Book has store, drop, copy {
        book_id: u64,
        address: address,
        title: String,
        author: String,
        available: bool,
    }

    // Initialize a new library
    public entry fun init_library(account: &signer) {
        let library_address = signer::address_of(account);
        let library = Library {
            books: table::new(),
            book_counter: 0
        };
        // Move the Library resource under the signer account
        move_to(account, library);
    }

    // Add a new book to the library
    public entry fun add_book(account: &signer, title: String, author: String) acquires Library {
        let library_address = signer::address_of(account);
        // Assert signer has created a library
        assert!(exists<Library>(library_address), E_NOT_INITIALIZED);
        let library = borrow_global_mut<Library>(library_address);

        let counter = library.book_counter + 1;
        let new_book = Book {
            book_id: counter,
            address: library_address,
            title,
            author,
            available: true
        };

        table::upsert(&mut library.books, counter, new_book);
        library.book_counter = counter;
        event::emit(new_book);
    }

    // Borrow a book from the library
    public entry fun borrow_book(account: &signer, book_id: u64) acquires Library {
        let library_address = signer::address_of(account);
        // Assert signer has created a library
        assert!(exists<Library>(library_address), E_NOT_INITIALIZED);
        let library = borrow_global_mut<Library>(library_address);
        // Assert book exists
        assert!(table::contains(&library.books, book_id), EBOOK_DOESNT_EXIST);
        let book = table::borrow_mut(&mut library.books, book_id);
        // Assert book is available
        assert!(book.available, EBOOK_ALREADY_BORROWED);
        // Mark book as borrowed
        book.available = false;
    }

    // Return a book to the library
    public entry fun return_book(account: &signer, book_id: u64) acquires Library {
        let library_address = signer::address_of(account);
        // Assert signer has created a library
        assert!(exists<Library>(library_address), E_NOT_INITIALIZED);
        let library = borrow_global_mut<Library>(library_address);
        // Assert book exists
        assert!(table::contains(&library.books, book_id), EBOOK_DOESNT_EXIST);
        let book = table::borrow_mut(&mut library.books, book_id);
        // Assert book is currently borrowed
        assert!(!book.available, EBOOK_NOT_BORROWED);
        // Mark book as returned
        book.available = true;
    }

    #[test(admin = @0x123)]
    public entry fun test_flow(admin: signer) acquires Library {
        // Create an admin @library_addr account for test
        account::create_account_for_test(signer::address_of(&admin));
        // Initialize library with admin account
        init_library(&admin);

        // Add a book by the admin account
        add_book(&admin, string::utf8(b"The Catcher in the Rye"), string::utf8(b"J.D. Salinger"));
        let library = borrow_global<Library>(signer::address_of(&admin));
        assert!(library.book_counter == 1, 5);
        
        let book_record = table::borrow(&library.books, library.book_counter);
        assert!(book_record.book_id == 1, 6);
        assert!(book_record.available == true, 7);
        assert!(book_record.title == string::utf8(b"The Catcher in the Rye"), 8);
        assert!(book_record.author == string::utf8(b"J.D. Salinger"), 9);
        assert!(book_record.address == signer::address_of(&admin), 10);

        // Borrow the book
        borrow_book(&admin, 1);
        let library = borrow_global<Library>(signer::address_of(&admin));
        let book_record = table::borrow(&library.books, 1);
        assert!(book_record.available == false, 11);

        // Return the book
        return_book(&admin, 1);
        let library = borrow_global<Library>(signer::address_of(&admin));
        let book_record = table::borrow(&library.books, 1);
        assert!(book_record.available == true, 12);
    }

    #[test(admin = @0x123)]
    #[expected_failure(abort_code = E_NOT_INITIALIZED)]
    public entry fun account_can_not_borrow_without_library(admin: signer) acquires Library {
        // Create an admin @library_addr account for test
        account::create_account_for_test(signer::address_of(&admin));
        // Account cannot borrow a book as no library was created
        borrow_book(&admin, 2);
    }
}