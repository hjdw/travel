import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiStar, FiCamera, FiMapPin, FiCalendar, FiEdit3 } from 'react-icons/fi';

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

interface Place {
  id: string;
  place_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
}

interface AddMemoryFormProps {
  onClose: () => void;
  onAdd: (memory: Omit<TravelMemory, 'id'>) => void;
  editingMemory?: TravelMemory | null;
}

const AddMemoryForm: React.FC<AddMemoryFormProps> = ({ onClose, onAdd, editingMemory }) => {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: '',
    description: '',
    imageUrl: '',
    rating: 5,
    coordinates: { lat: 0, lng: 0 }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (editingMemory) {
      setFormData({
        title: editingMemory.title,
        location: editingMemory.location,
        date: editingMemory.date,
        description: editingMemory.description,
        imageUrl: editingMemory.imageUrl,
        rating: editingMemory.rating,
        coordinates: editingMemory.coordinates || { lat: 0, lng: 0 }
      });
      setSearchQuery(editingMemory.location);
    }
  }, [editingMemory]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const searchPlaces = useCallback((query: string) => {
    if (!query.trim() || !window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      setSearchResults([]);
      return;
    }

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(query, (data: Place[], status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    });
  }, []);

  useEffect(() => {
    searchPlaces(debouncedQuery);
  }, [debouncedQuery, searchPlaces]);

  const handleLocationSelect = (place: Place) => {
    setSearchQuery(place.place_name);
    setFormData({
      ...formData,
      location: place.place_name,
      coordinates: {
        lat: parseFloat(place.y),
        lng: parseFloat(place.x),
      },
    });
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  const handleRatingChange = (rating: number) => {
    setFormData({ ...formData, rating });
  };

  const getCoordinates = async () => {
    if (!formData.location.trim()) {
      alert('먼저 장소를 입력해주세요.');
      return;
    }

    try {
      // 카카오맵 API 로딩 상태 확인
      if (!window.kakao || !window.kakao.maps) {
        alert('지도 API가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // 카카오맵이 완전히 로드될 때까지 대기
      if (!window.kakao.maps.loaded) {
        await new Promise<void>((resolve) => {
          window.kakao.maps.load(() => {
            resolve();
          });
        });
      }

      // Geocoder 서비스 초기화
      const geocoder = new window.kakao.maps.services.Geocoder();
      
      // 주소 검색 실행
      geocoder.addressSearch(formData.location, (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK && result && result.length > 0) {
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
          setFormData({
            ...formData,
            coordinates: { 
              lat: parseFloat(result[0].y), 
              lng: parseFloat(result[0].x) 
            }
          });
          alert(`좌표가 설정되었습니다!\n위도: ${result[0].y}\n경도: ${result[0].x}`);
        } else {
          console.error('Geocoder status:', status);
          alert('주소를 찾을 수 없습니다. 다른 주소를 입력해주세요.');
        }
      });
    } catch (error) {
      console.error('좌표 변환 오류:', error);
      alert('좌표 변환 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <FormContainer
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass"
        >
          <FormHeader>
            <HeaderContent>
              <HeaderIcon>
                {editingMemory ? <FiEdit3 /> : <FiCamera />}
              </HeaderIcon>
              <HeaderText>
                <h2>{editingMemory ? '추억 수정' : '새 추억'}</h2>
                <p>{editingMemory ? '여행 추억을 수정해보세요' : '새로운 여행 추억을 만들어보세요'}</p>
              </HeaderText>
            </HeaderContent>
            <CloseButton onClick={onClose}>
              <FiX />
            </CloseButton>
          </FormHeader>

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>
                <span>제목</span>
                <RequiredBadge>*</RequiredBadge>
              </Label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="여행 제목을 입력하세요"
                required
                className="modern-input"
              />
            </FormGroup>

            <FormRow>
              <FormGroup style={{ position: 'relative' }}>
                <Label>
                  <FiMapPin />
                  <span>장소 검색</span>
                  <RequiredBadge>*</RequiredBadge>
                </Label>
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearching(true);
                  }}
                  onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                  placeholder="장소 이름으로 검색"
                  required
                  className="modern-input"
                />
                {isSearching && searchResults.length > 0 && (
                  <SearchResultsList>
                    {searchResults.map((place) => (
                      <SearchResultItem
                        key={place.id}
                        onMouseDown={() => handleLocationSelect(place)}
                      >
                        <h4>{place.place_name}</h4>
                        <p>{place.road_address_name}</p>
                      </SearchResultItem>
                    ))}
                  </SearchResultsList>
                )}
              </FormGroup>

              <FormGroup>
                <Label>
                  <FiCalendar />
                  <span>날짜</span>
                  <RequiredBadge>*</RequiredBadge>
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="modern-input"
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>
                <FiMapPin />
                <span>좌표 설정</span>
              </Label>
              <CoordinateRow>
                <Input
                  type="text"
                  value={formData.coordinates.lat.toFixed(6)}
                  onChange={(e) => setFormData({
                    ...formData,
                    coordinates: { ...formData.coordinates, lat: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="위도"
                  className="modern-input"
                />
                <Input
                  type="text"
                  value={formData.coordinates.lng.toFixed(6)}
                  onChange={(e) => setFormData({
                    ...formData,
                    coordinates: { ...formData.coordinates, lng: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="경도"
                  className="modern-input"
                />
                <CoordinateButton type="button" onClick={getCoordinates}>
                  주소로 찾기
                </CoordinateButton>
              </CoordinateRow>
            </FormGroup>

            <FormGroup>
              <Label>
                <FiCamera />
                <span>이미지 파일</span>
                <RequiredBadge>*</RequiredBadge>
              </Label>
              <FileInput
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required={!formData.imageUrl}
              />
              <FileLabel htmlFor="image-upload">
                {formData.imageUrl ? '이미지 변경' : '이미지 선택'}
              </FileLabel>
              {formData.imageUrl && (
                <ImagePreviewContainer>
                  <ImagePreview src={formData.imageUrl} alt="Memory preview" />
                </ImagePreviewContainer>
              )}
            </FormGroup>

            <FormGroup>
              <Label>
                <FiStar />
                <span>평점</span>
              </Label>
              <RatingContainer>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarButton
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    isActive={star <= formData.rating}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiStar />
                  </StarButton>
                ))}
                <RatingText>{formData.rating}점</RatingText>
              </RatingContainer>
            </FormGroup>

            <FormGroup>
              <Label>
                <span>설명</span>
                <RequiredBadge>*</RequiredBadge>
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="여행에 대한 설명을 입력하세요"
                rows={4}
                required
                className="modern-input"
              />
            </FormGroup>

            <FormActions>
              <CancelButton type="button" onClick={onClose}>
                취소
              </CancelButton>
              <SubmitButton type="submit" className="minimal-btn">
                {editingMemory ? '수정 완료' : '추억 저장'}
              </SubmitButton>
            </FormActions>
          </Form>
        </FormContainer>
      </Overlay>
    </AnimatePresence>
  );
};

// 카카오맵 타입 선언
declare global {
  interface Window {
    kakao: any;
  }
}

const Overlay = styled(motion.div)`
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

const FormContainer = styled(motion.div)`
  background: var(--background-color);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
`;

const FormHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
  
  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 1;
`;

const HeaderIcon = styled.div`
  font-size: 2rem;
  opacity: 0.9;
`;

const HeaderText = styled.div`
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  p {
    font-size: 0.9rem;
    opacity: 0.8;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 1.25rem;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 12px;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
`;

const Form = styled.form`
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-color);
`;

const RequiredBadge = styled.span`
  color: #ef4444;
  margin-left: 0.25rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(93, 147, 227, 0.2);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(93, 147, 227, 0.2);
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
`;

const CoordinateRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
  align-items: end;
`;

const CoordinateButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
`;

const StarButton = styled(motion.button)<{ isActive: boolean }>`
  background: none;
  border: none;
  font-size: 1.75rem;
  color: ${props => props.isActive ? '#fbbf24' : '#e0e0e0'};
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.isActive ? '#fbbf24' : '#ffed4e'};
    transform: scale(1.1);
  }
`;

const RatingText = styled.span`
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
  margin-left: 0.5rem;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
`;

const SubmitButton = styled.button`
  /* using .minimal-btn */
`;

const CancelButton = styled.button`
  background-color: #e5e7eb;
  color: var(--text-color-light);
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  
  &:hover {
    background-color: #d1d5db;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const FileLabel = styled.label`
  display: inline-block;
  padding: 0.6rem 1.2rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e5e7eb;
    border-color: #9ca3af;
  }
`;

const ImagePreviewContainer = styled.div`
  margin-top: 1rem;
  width: 100%;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
`;

const ImagePreview = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const SearchResultsList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-top: 0.5rem;
  max-height: 250px;
  overflow-y: auto;
  z-index: 10;
`;

const SearchResultItem = styled.div`
  padding: 0.8rem 1.2rem;
  cursor: pointer;
  
  h4 {
    margin: 0 0 0.2rem 0;
    font-size: 0.95rem;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    font-size: 0.85rem;
    color: #6b7280;
  }

  &:hover {
    background-color: #f3f4f6;
  }
`;

export default AddMemoryForm; 