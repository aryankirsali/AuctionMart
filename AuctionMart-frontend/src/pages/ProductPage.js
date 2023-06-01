import axios from "../axios";
import React, { useEffect, useState } from "react";
import AliceCarousel from "react-alice-carousel";
import "react-alice-carousel/lib/alice-carousel.css";
import {
  Container,
  Row,
  Col,
  Badge,
  ButtonGroup,
  Form,
  Button,
  Modal,
} from "react-bootstrap";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Loading from "../components/Loading";
import SimilarProduct from "../components/SimilarProduct";
import "./ProductPage.css";
import { LinkContainer } from "react-router-bootstrap";
import { useAddToCartMutation } from "../services/appApi";
import ToastMessage from "../components/ToastMessage";

function ProductPage() {
  const { id } = useParams();
  const user = useSelector((state) => state.user);
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState(null);
  const [addToCart, { isSuccess }] = useAddToCartMutation();
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidFormData, setBidFormData] = useState({
    name: user.name || "",
    phoneNumber: user.phoneNumber || "",
    email: user.email || "",
    bid: "",
  });

  const handleDragStart = (e) => e.preventDefault();

  useEffect(() => {
    axios.get(`/products/${id}`).then(({ data }) => {
      setProduct(data.product);
      setSimilar(data.similar);
    });
  }, [id]);

  const handleBidClick = () => {
    setShowBidModal(true);
  };

  const handleCloseBidModal = () => {
    setShowBidModal(false);
    // Reset form fields
    setBidFormData({
      name: user.name || "",
      phoneNumber: user.phoneNumber || "",
      email: user.email || "",
      bid: "",
    });
  };

  const handleBidFormChange = (e) => {
    setBidFormData({ ...bidFormData, [e.target.name]: e.target.value });
  };

  const handleBidFormSubmit = (e) => {
    e.preventDefault();
    // Send message here using bidFormData
    axios
      .post("/api/send-bid-message", bidFormData)
      .then((response) => {
        // Message sent successfully
        console.log("Message sent:", response.data);
        // Close the bid modal and reset form fields
        handleCloseBidModal();
      })
      .catch((error) => {
        // Error occurred while sending message
        console.error("Error sending message:", error);
        // Handle the error appropriately (e.g., show an error message to the user)
      });
  };

  if (!product) {
    return <Loading />;
  }

  const responsive = {
    0: { items: 1 },
    568: { items: 2 },
    1024: { items: 3 },
  };

  const images = product.pictures.map((picture) => (
    <img
      className="product__carousel--image"
      src={picture.url}
      onDragStart={handleDragStart}
    />
  ));

  let similarProducts = [];
  if (similar) {
    similarProducts = similar.map((product, idx) => (
      <div className="item" data-value={idx}>
        <SimilarProduct {...product} />
      </div>
    ));
  }

  return (
    <Container className="pt-4" style={{ position: "relative" }}>
      <Row>
        <Col lg={6}>
          <AliceCarousel
            mouseTracking
            items={images}
            controlsStrategy="alternate"
          />
        </Col>
        <Col lg={6} className="pt-4">
          <h1>{product.name}</h1>
          <p>
            <Badge bg="primary">{product.category}</Badge>
          </p>
          <p className="product__price">₹{product.price}</p>
          <p style={{ textAlign: "justify" }} className="py-3">
            <strong>Description:</strong> {product.description}
          </p>
          {user && !user.isAdmin && (
            <ButtonGroup style={{ width: "90%" }}>
              <Form.Select
                size="lg"
                style={{ width: "40%", borderRadius: "0" }}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </Form.Select>
              <Button
                size="lg"
                className="me-2 rounded"
                onClick={() =>
                  addToCart({
                    userId: user._id,
                    productId: id,
                    price: product.price,
                    image: product.pictures[0].url,
                  })
                }
              >
                Add to cart
              </Button>
              <Button
                size="lg"
                className="btn btn-warning rounded"
                onClick={handleBidClick}
              >
                Bid
              </Button>
            </ButtonGroup>
          )}
          {user && user.isAdmin && (
            <LinkContainer to={`/product/${product._id}/edit`}>
              <Button size="lg">Edit Product</Button>
            </LinkContainer>
          )}
          {isSuccess && (
            <ToastMessage
              bg="info"
              title="Added to cart"
              body={`${product.name} is in your cart`}
            />
          )}
        </Col>
      </Row>
      <div className="my-4">
        <h2>Similar Products</h2>
        <div className="d-flex justify-content-center align-items-center flex-wrap">
          <AliceCarousel
            mouseTracking
            items={similarProducts}
            responsive={responsive}
            controlsStrategy="alternate"
          />
        </div>
      </div>

      <Modal show={showBidModal} onHide={handleCloseBidModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Place a Bid</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleBidFormSubmit}>
            <Form.Group controlId="formBidName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={bidFormData.name}
                onChange={handleBidFormChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formBidPhoneNumber">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="tel"
                name="phoneNumber"
                value={bidFormData.phoneNumber}
                onChange={handleBidFormChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formBidEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={bidFormData.email}
                onChange={handleBidFormChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formBidAmount">
              <Form.Label>Bid Amount (₹)</Form.Label>
              <Form.Control
                type="number"
                name="bid"
                value={bidFormData.bid}
                onChange={handleBidFormChange}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Send Bid
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default ProductPage;
