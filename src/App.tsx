import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import './App.css';

interface DocumentData {
  id: string;
  [key: string]: any;
}

interface CollectionData {
  name: string;
  documents: DocumentData[];
}

function App() {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [newDocument, setNewDocument] = useState<{[key: string]: any}>({});
  const [editingDoc, setEditingDoc] = useState<{id: string, data: {[key: string]: any}} | null>(null);

  // 모든 컬렉션 목록 가져오기
  const fetchCollections = async () => {
    try {
      setLoading(true);
      // memos 컬렉션을 제외한 컬렉션들만 표시
      const knownCollections = ['Baekun', 'Changjo', 'Chungsong', 'ConvergenceHall', 'Jeongui', 'Mirae'];
      
      const collectionsData: CollectionData[] = [];
      
      for (const collectionName of knownCollections) {
        try {
          const querySnapshot = await getDocs(collection(db, collectionName));
          const documents: DocumentData[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            documents.push({
              id: doc.id,
              ...data
            });
          });
          
          collectionsData.push({
            name: collectionName,
            documents: documents
          });
        } catch (error) {
          console.log(`컬렉션 ${collectionName}을 가져오는 중 오류:`, error);
        }
      }
      
      setCollections(collectionsData);
      if (collectionsData.length > 0) {
        setSelectedCollection(collectionsData[0].name);
      }
    } catch (error) {
      console.error('컬렉션을 가져오는 중 오류 발생:', error);
    } finally {
      setLoading(false);
    }
  };

  // 새 문서 추가
  const addDocument = async (collectionName: string) => {
    if (Object.keys(newDocument).length === 0) return;

    try {
      await addDoc(collection(db, collectionName), {
        ...newDocument,
        createdAt: new Date()
      });
      setNewDocument({});
      fetchCollections();
    } catch (error) {
      console.error('문서 추가 중 오류 발생:', error);
    }
  };

  // 문서 삭제
  const deleteDocument = async (collectionName: string, docId: string) => {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      fetchCollections();
    } catch (error) {
      console.error('문서 삭제 중 오류 발생:', error);
    }
  };

  // 문서 수정
  const updateDocument = async (collectionName: string, docId: string, data: {[key: string]: any}) => {
    try {
      await updateDoc(doc(db, collectionName, docId), data);
      setEditingDoc(null);
      fetchCollections();
    } catch (error) {
      console.error('문서 수정 중 오류 발생:', error);
    }
  };

  // 새 필드 추가
  const addField = (key: string, value: string) => {
    setNewDocument(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 필드 제거
  const removeField = (key: string) => {
    const { [key]: removed, ...rest } = newDocument;
    setNewDocument(rest);
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const selectedCollectionData = collections.find(col => col.name === selectedCollection);

  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <h2>데이터를 불러오는 중...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔥 Firestore 데이터 뷰어</h1>
      </header>
      
      <main className="App-main">
        {/* 컬렉션 선택 */}
        <div className="collection-selector">
          <h2>컬렉션 선택</h2>
          <div className="collection-buttons">
            {collections.map((collection) => (
              <button
                key={collection.name}
                onClick={() => setSelectedCollection(collection.name)}
                className={`collection-button ${selectedCollection === collection.name ? 'active' : ''}`}
              >
                {collection.name} ({collection.documents.length})
              </button>
            ))}
          </div>
        </div>

        {selectedCollectionData && (
          <>
            {/* 새 문서 추가 */}
            <div className="document-form">
              <h2>새 문서 추가 - {selectedCollection}</h2>
              <div className="field-inputs">
                {Object.entries(newDocument).map(([key, value]) => (
                  <div key={key} className="field-input">
                    <input
                      type="text"
                      placeholder="필드명"
                      value={key}
                      onChange={(e) => {
                        const newData = { ...newDocument };
                        delete newData[key];
                        newData[e.target.value] = value;
                        setNewDocument(newData);
                      }}
                    />
                    <input
                      type="text"
                      placeholder="값"
                      value={value}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, [key]: e.target.value }))}
                    />
                    <button onClick={() => removeField(key)} className="remove-field">삭제</button>
                  </div>
                ))}
                <button 
                  onClick={() => addField(`field${Object.keys(newDocument).length + 1}`, '')}
                  className="add-field-button"
                >
                  + 필드 추가
                </button>
              </div>
              <button 
                onClick={() => addDocument(selectedCollection)}
                className="add-document-button"
                disabled={Object.keys(newDocument).length === 0}
              >
                문서 추가
              </button>
            </div>

            {/* 문서 목록 */}
            <div className="document-list">
              <h2>문서 목록 - {selectedCollection}</h2>
              {selectedCollectionData.documents.length === 0 ? (
                <p className="no-documents">이 컬렉션에는 문서가 없습니다.</p>
              ) : (
                selectedCollectionData.documents.map((document) => (
                  <div key={document.id} className="document-item">
                    {editingDoc?.id === document.id ? (
                      // 수정 모드
                      <div className="document-edit">
                        <h3>문서 ID: {document.id}</h3>
                        {Object.entries(editingDoc.data).map(([key, value]) => (
                          <div key={key} className="field-input">
                            <label>{key}:</label>
                            <input
                              type="text"
                              value={value as string}
                              onChange={(e) => setEditingDoc(prev => prev ? {
                                ...prev,
                                data: { ...prev.data, [key]: e.target.value }
                              } : null)}
                            />
                          </div>
                        ))}
                        <div className="document-actions">
                          <button onClick={() => updateDocument(selectedCollection, document.id, editingDoc.data)} className="save-button">
                            저장
                          </button>
                          <button onClick={() => setEditingDoc(null)} className="cancel-button">
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 보기 모드
                      <div className="document-content">
                        <h3>문서 ID: {document.id}</h3>
                        <div className="document-fields">
                          {Object.entries(document).filter(([key]) => key !== 'id').map(([key, value]) => (
                            <div key={key} className="field">
                              <strong>{key}:</strong> 
                              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="document-actions">
                          <button onClick={() => setEditingDoc({id: document.id, data: {...document}})} className="edit-button">
                            수정
                          </button>
                          <button onClick={() => deleteDocument(selectedCollection, document.id)} className="delete-button">
                            삭제
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
