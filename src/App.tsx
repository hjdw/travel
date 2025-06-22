import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, Reorder } from 'framer-motion';
import { FiMapPin, FiCalendar, FiStar, FiPlus, FiEdit3, FiTrash2, FiHome, FiMove } from 'react-icons/fi';
import AddMemoryForm from './components/AddMemoryForm';

interface TravelMemory {
  id: string;
  title: string;
  location: string;
  date: string;
  description: string;
  imageUrl: string;
  rating: number;
  coordinates?: { lat: number; lng: number };
}

const App: React.FC = () => {
  const [memories, setMemories] = useState<TravelMemory[]>([
    {
      id: '1',
      title: '제주도 여행',
      location: '제주특별자치도',
      date: '2024-01-15',
      description: '한라산 등반과 해변 산책을 즐긴 멋진 여행이었습니다.',
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      rating: 5,
      coordinates: { lat: 33.4996, lng: 126.5312 }
    },
    {
      id: '2',
      title: '부산 해운대',
      location: '부산광역시',
      date: '2024-02-20',
      description: '해운대 해수욕장에서 일몰을 보며 평화로운 시간을 보냈습니다.',
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      rating: 4,
      coordinates: { lat: 35.1586, lng: 129.1603 }
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<TravelMemory | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

 // 카카오맵 API 로드
useEffect(() => {
  const loadKakaoMap = () => {
    try {
      if (document.querySelector("script[src*='dapi.kakao.com']")) {
        console.log('카카오맵 API가 이미 로드되어 있습니다.');
        return;
      }

      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=5a375a3a3f1d59aa5e335c21c2e7cda7&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => {
        if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
          window.kakao.maps.load(() => {
            console.log('카카오맵 API 로드 완료');
          });
        }
      };
      script.onerror = () => {
        console.error('카카오맵 API 로드 실패');
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('카카오맵 API 로드 중 오류:', error);
    }
  };

  loadKakaoMap();
}, []);

// 지도 렌더링
useEffect(() => {
  if (!showMap || !window.kakao || !window.kakao.maps || !memories.length) return;

  window.kakao.maps.load(() => {
    try {
      const container = document.getElementById('kakao-map');
      if (!container) return;

      const center = memories[0].coordinates || { lat: 36.5, lng: 127.5 };
      const options = {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: 8
      };
      const map = new window.kakao.maps.Map(container, options);

      memories.forEach(memory => {
        if (memory.coordinates) {
          const markerPosition = new window.kakao.maps.LatLng(memory.coordinates.lat, memory.coordinates.lng);
          const marker = new window.kakao.maps.Marker({ position: markerPosition });
          marker.setMap(map);

          const infowindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #333;">${memory.title}</h3>
                <p style="margin: 0; font-size: 12px; color: #666;">${memory.location}</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">${memory.date}</p>
                <div style="margin-top: 5px;">
                  ${[...Array(5)].map((_, i) =>
                    `<span style="color: ${i < memory.rating ? '#fbbf24' : '#e5e7eb'}; font-size: 12px;">★</span>`
                  ).join('')}
                </div>
              </div>
            `
          });
          window.kakao.maps.event.addListener(marker, 'click', () => infowindow.open(map, marker));
        }
      });
    } catch (error) {
      console.error("Map rendering error inside load callback:", error);
      alert("지도 렌더링 중 오류가 발생했습니다.");
    }
  });
}, [showMap, memories]);

  const addMemory = (memory: Omit<TravelMemory, 'id'>) => {
    const newMemory = {
      ...memory,
      id: Date.now().toString()
    };
    setMemories([...memories, newMemory]);
    setShowAddForm(false);
  };

  const deleteMemory = (id: string) => {
    setMemories(memories.filter(memory => memory.id !== id));
  };

  const openMap = () => {
    setShowMap(true);
  };

  const closeMap = () => {
    setShowMap(false);
  };

  const handleReorder = (newOrder: unknown[]) => {
    setMemories(newOrder as TravelMemory[]);
  };

  return (
    <AppContainer>
      <Header>
        <Title>나의 여행 기록</Title>
        <Subtitle>소중한 여행의 순간들을 모아보세요.</Subtitle>
        <HeaderActions>
          <Stats>
            <Stat>
              <StatNum>{memories.length}</StatNum>
              <StatLabel>추억</StatLabel>
            </Stat>
            <Stat>
              <StatNum>{(memories.reduce((acc, m) => acc + m.rating, 0) / (memories.length || 1)).toFixed(1)}</StatNum>
              <StatLabel>평균 평점</StatLabel>
            </Stat>
          </Stats>
          <MapButton onClick={openMap}>
            <FiMapPin /> 지도 보기
          </MapButton>
        </HeaderActions>
      </Header>

      <MainContent>
        <AddButton onClick={() => setShowAddForm(true)}>
          <FiPlus /> 새 추억 기록하기
        </AddButton>

        {memories.length > 0 && (
          <ReorderGroup
            axis="y"
            values={memories}
            onReorder={handleReorder}
          >
            {memories.map((memory, idx) => (
              <Reorder.Item
                key={memory.id}
                value={memory}
                whileDrag={{ 
                  scale: 1.05,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  zIndex: 1000
                }}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
              >
                <MemoryCard>
                  <MemoryImage src={memory.imageUrl} alt={memory.title} />
                  <MemoryContent>
                    <CardHeader>
                      <MemoryTitle>{memory.title}</MemoryTitle>
                      <ActionButtons>
                        <IconBtn onClick={() => setEditingMemory(memory)} title="수정">
                          <FiEdit3 />
                        </IconBtn>
                        <IconBtn onClick={() => deleteMemory(memory.id)} title="삭제" className="delete">
                          <FiTrash2 />
                        </IconBtn>
                      </ActionButtons>
                    </CardHeader>
                    <MemoryMeta>
                      <MemoryLocation><FiMapPin />{memory.location}</MemoryLocation>
                      <MemoryDate><FiCalendar />{memory.date}</MemoryDate>
                    </MemoryMeta>
                    <MemoryDescription>{memory.description}</MemoryDescription>
                    <CardFooter>
                      <RatingContainer>
                        {[...Array(5)].map((_, i) => (
                          <FiStar 
                            key={i} 
                            style={{ 
                              color: i < memory.rating ? '#fbbf24' : '#e5e7eb', 
                              fontSize: '1.1em',
                              fill: i < memory.rating ? '#fbbf24' : 'none'
                            }} 
                          />
                        ))}
                      </RatingContainer>
                      <DragHandle>
                        <FiMove />
                      </DragHandle>
                    </CardFooter>
                  </MemoryContent>
                </MemoryCard>
              </Reorder.Item>
            ))}
          </ReorderGroup>
        )}

        {memories.length === 0 && (
          <EmptyState className="glass" as={motion.div} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            <EmptyIcon>📷</EmptyIcon>
            <EmptyTitle>아직 추억이 없어요</EmptyTitle>
            <EmptyText>여행의 첫 추억을 남겨보세요!</EmptyText>
            <AddButton className="minimal-btn" onClick={() => setShowAddForm(true)}>
              <FiPlus /> 첫 추억 만들기
            </AddButton>
          </EmptyState>
        )}
      </MainContent>

      {showMap && (
        <MapModal onClick={closeMap}>
          <MapContainer onClick={(e) => e.stopPropagation()}>
            <MapHeader>
              <h3>여행 지도</h3>
              <CloseButton onClick={closeMap}>×</CloseButton>
            </MapHeader>
            <KakaoMap id="kakao-map" />
          </MapContainer>
        </MapModal>
      )}

      {showAddForm && (
        <AddMemoryForm
          onClose={() => setShowAddForm(false)}
          onAdd={addMemory}
        />
      )}
      {editingMemory && (
        <AddMemoryForm
          onClose={() => setEditingMemory(null)}
          onAdd={(memory) => {
            setMemories(memories.map(m => m.id === editingMemory.id ? { ...memory, id: editingMemory.id } : m));
            setEditingMemory(null);
          }}
          editingMemory={editingMemory}
        />
      )}
    </AppContainer>
  );
};

declare global {
  interface Window {
    kakao: any;
  }
}

const AppContainer = styled.div`
  background-color: var(--background-color);
  padding-bottom: 60px;
`;

const Header = styled.header`
  background: white;
  padding: 40px 60px;
  border-bottom: 1px solid var(--border-color);
  text-align: left;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  color: var(--text-color);
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-color-light);
  margin: 8px 0 0 0;
`;

const HeaderActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
`;

const Stats = styled.div`
  display: flex;
  gap: 2rem;
`;

const Stat = styled.div`
  text-align: left;
`;

const StatNum = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary-color);
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: var(--text-color-light);
`;

const MapButton = styled.button`
  /* using .minimal-btn from index.css */
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 40px auto 0;
  padding: 0 60px;
`;

const AddButton = styled.button`
  /* using .minimal-btn from index.css */
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  margin-bottom: 40px;
`;

const ReorderGroup = styled(Reorder.Group)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2.2rem;
`;

const MemoryCard = styled(motion.div)`
  background: var(--card-background);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px var(--shadow-color);
  overflow: hidden;
  transition: box-shadow 0.3s, transform 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px var(--shadow-color);
  }
`;

const MemoryImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const MemoryContent = styled.div`
  padding: 20px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const MemoryTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const IconBtn = styled.button`
  background: transparent;
  color: var(--text-color-light);
  font-size: 1.2rem;
  padding: 4px;

  &:hover {
    color: var(--primary-color);
  }

  &.delete:hover {
    color: #e53e3e;
  }
`;

const MemoryMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--text-color-light);
  font-size: 0.9rem;
  margin-bottom: 16px;
`;

const MemoryLocation = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3em;
`;

const MemoryDate = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3em;
`;

const MemoryDescription = styled.p`
  color: var(--text-color);
  font-size: 1rem;
  line-height: 1.7;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
`;

const RatingContainer = styled.div`
  display: flex;
  gap: 0.1em;
`;

const DragHandle = styled.div`
  cursor: grab;
  color: var(--text-color-light);
`;

const EmptyState = styled.div`
  margin: 60px auto 0 auto;
  max-width: 400px;
  text-align: center;
  padding: 2.5em 1.5em 2em 1.5em;
`;

const EmptyIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.7em;
`;

const EmptyTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.3em;
`;

const EmptyText = styled.p`
  color: #6b7280;
  font-size: 1em;
  margin-bottom: 1.2em;
`;

const MapModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const MapContainer = styled.div`
  background: white;
  border-radius: 18px;
  width: 100%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
`;

const MapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  
  h3 {
    font-size: 1.2rem;
    font-weight: 600;
    color: #222;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.2s;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const KakaoMap = styled.div`
  width: 100%;
  height: 500px;
`;

export default App;