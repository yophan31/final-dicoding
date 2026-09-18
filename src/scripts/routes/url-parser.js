const RouteResolver = {
  decodeActiveHashWithPattern() {
    const rawHash = window.location.hash.slice(1).toLowerCase();
    const segmentObj = this._tokenizeHash(rawHash);
    return this._synthesizePattern(segmentObj);
  },

  decodeActiveHashRaw() {
    const rawHash = window.location.hash.slice(1).toLowerCase();
    return this._tokenizeHash(rawHash);
  },

  _tokenizeHash(hashString) {
    const parts = hashString.split('/');
    return {
      endpointSegment: parts[1] || null,
      identifierSegment: parts[2] || null,
      actionSegment: parts[3] || null,
    };
  },

  _synthesizePattern(tokenized) {
    return (tokenized.endpointSegment ? `/${tokenized.endpointSegment}` : '/') +
      (tokenized.identifierSegment ? '/:id' : '') +
      (tokenized.actionSegment ? `/${tokenized.actionSegment}` : '');
  },
};

export default RouteResolver;
