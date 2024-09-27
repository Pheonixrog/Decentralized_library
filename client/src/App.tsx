'use client'

import React, { useState, useEffect } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { AptosClient } from 'aptos'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// New imports
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Layout, Row, Col, Button, Spin, List, Checkbox, Input } from "antd";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { Aptos } from "@aptos-labs/ts-sdk";

const aptos = new Aptos();
const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1')
const MODULE_ADDRESS = '0x1c4b961494164959385f8d0154cfeed379200521ab05463eb09e86436447c797' // Replace with your actual module address

type Book = {
  book_id: string
  title: string
  author: string
  available: boolean
}

export default function LibraryManager() {
  const { account, signAndSubmitTransaction } = useWallet()
  const [books, setBooks] = useState<Book[]>([])
  const [newBookTitle, setNewBookTitle] = useState('')
  const [newBookAuthor, setNewBookAuthor] = useState('')
  const [isLibraryInitialized, setIsLibraryInitialized] = useState(false)

  useEffect(() => {
    if (account) {
      checkLibraryInitialized()
      fetchBooks()
    }
  }, [account])

  const checkLibraryInitialized = async () => {
    if (account) {
      try {
        await client.getAccountResource(account.address, `${MODULE_ADDRESS}::LibraryManager::Library`)
        setIsLibraryInitialized(true)
      } catch (error) {
        setIsLibraryInitialized(false)
      }
    }
  }

  const fetchBooks = async () => {
    if (account && isLibraryInitialized) {
      try {
        const libraryResource = await client.getAccountResource(account.address, `${MODULE_ADDRESS}::LibraryManager::Library`)
        const booksTable = (libraryResource.data as any).books.handle
        const bookCounter = parseInt((libraryResource.data as any).book_counter)
        
        const fetchedBooks: Book[] = []
        for (let i = 1; i <= bookCounter; i++) {
          const bookData = await client.getTableItem(booksTable, {
            key_type: "u64",
            value_type: `${MODULE_ADDRESS}::LibraryManager::Book`,
            key: i.toString()
          })
          fetchedBooks.push({
            book_id: bookData.book_id,
            title: bookData.title,
            author: bookData.author,
            available: bookData.available
          })
        }
        setBooks(fetchedBooks)
      } catch (error) {
        console.error('Error fetching books:', error)
      }
    }
  }

  const initLibrary = async () => {
    if (!account) return
    try {
      await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDRESS}::LibraryManager::init_library`,
          typeArguments: [],
          functionArguments: []
        }
      })
      toast.success('Library initialized successfully!')
      setIsLibraryInitialized(true)
    } catch (error) {
      console.error('Error initializing library:', error)
      toast.error('Failed to initialize library')
    }
  }

  const addBook = async () => {
    if (!account || !newBookTitle || !newBookAuthor) return
    try {
      await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDRESS}::LibraryManager::add_book`,
          typeArguments: [],
          functionArguments: [newBookTitle, newBookAuthor]
        }
      })
      toast.success('Book added successfully!')
      setNewBookTitle('')
      setNewBookAuthor('')
      fetchBooks()
    } catch (error) {
      console.error('Error adding book:', error)
      toast.error('Failed to add book')
    }
  }

  const borrowBook = async (bookId: string) => {
    if (!account) return
    try {
      await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDRESS}::LibraryManager::borrow_book`,
          typeArguments: [],
          functionArguments: [bookId]
        }
      })
      toast.success('Book borrowed successfully!')
      fetchBooks()
    } catch (error) {
      console.error('Error borrowing book:', error)
      toast.error('Failed to borrow book')
    }
  }

  const returnBook = async (bookId: string) => {
    if (!account) return
    try {
      await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDRESS}::LibraryManager::return_book`,
          typeArguments: [],
          functionArguments: [bookId]
        }
      })
      toast.success('Book returned successfully!')
      fetchBooks()
    } catch (error) {
      console.error('Error returning book:', error)
      toast.error('Failed to return book')
    }
  }

  return (
    <div className="library-manager">
      
<Col span={12} style={{ textAlign: "right", paddingRight: "200px" }}>
  <WalletSelector />
</Col>

      <ToastContainer position="top-right" autoClose={5000} />
      <h1>Aptos Library Manager</h1>

    {/* {
!isLibraryInitialized ?(
  <div className="card">
    <h2>Initialize Library</h2>
    <p>You need to initialize the library before you can use it.</p>
    
    <button onClick={initLibrary}>Initialize Library</button>

    
    
  </div>
) : (
  <>
    <div className="card">
      <h2>Add New Book</h2>
      <div className="form-group">
        <input
          type="text"
          placeholder="Book Title"
          value={newBookTitle}
          onChange={(e) => setNewBookTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Author"
          value={newBookAuthor}
          onChange={(e) => setNewBookAuthor(e.target.value)}
        />
        <button onClick={addBook}>Add Book</button>
      </div>
    </div>

    <div className="card">
      <h2>Library Books</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Author</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.book_id}>
              <td>{book.book_id}</td>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.available ? 'Available' : 'Borrowed'}</td>
              <td>
                {book.available ? (
                  <button onClick={() => borrowBook(book.book_id)}>Borrow</button>
                ) : (
                  <button onClick={() => returnBook(book.book_id)}>Return</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
)} */}


      
      {!account ? (
        <p>Please connect your wallet to use the library.</p>
      ) : !isLibraryInitialized ?(
        <div className="card">
          <h2>Initialize Library</h2>
          <p>You need to initialize the library before you can use it.</p>
          
          <button onClick={initLibrary}>Initialize Library</button>

          
          
        </div>
      ) : (
        <>
          <div className="card">
            <h2>Add New Book</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Book Title"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
              />
              <input
                type="text"
                placeholder="Author"
                value={newBookAuthor}
                onChange={(e) => setNewBookAuthor(e.target.value)}
              />
              <button onClick={addBook}>Add Book</button>
            </div>
          </div>

          <div className="card">
            <h2>Library Books</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.book_id}>
                    <td>{book.book_id}</td>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.available ? 'Available' : 'Borrowed'}</td>
                    <td>
                      {book.available ? (
                        <button onClick={() => borrowBook(book.book_id)}>Borrow</button>
                      ) : (
                        <button onClick={() => returnBook(book.book_id)}>Return</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style >{`
        .library-manager {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        h1 {
          color: #333;
          text-align: center;
        }

        .card {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        h2 {
          color: #444;
          margin-top: 0;
        }

        .form-group {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        input {
          flex-grow: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        button {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        button:hover {
          background-color: #45a049;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid #ddd;
        }

        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }

        tr:nth-child(even) {
          background-color: #f8f8f8;
        }

        @media (max-width: 600px) {
          .form-group {
            flex-direction: column;
          }

          table, thead, tbody, th, td, tr {
            display: block;
          }

          thead tr {
            position: absolute;
            top: -9999px;
            left: -9999px;
          }

          tr {
            margin-bottom: 15px;
          }

          td {
            border: none;
            position: relative;
            padding-left: 50%;
          }

          td:before {
            position: absolute;
            top: 6px;
            left: 6px;
            width: 45%;
            padding-right: 10px;
            white-space: nowrap;
            content: attr(data-label);
            font-weight: bold;
          }
        }
      `}</style>
    </div>
  )
}